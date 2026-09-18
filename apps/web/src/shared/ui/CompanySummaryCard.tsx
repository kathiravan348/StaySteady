// A summary of the company research record (UI spec 20.2), shared by the Instrument Workspace
// right panel and Position Detail (decision 25): classification, parent and group, the next
// scheduled event, any open warning flag, optionally the headline measures, and a link to the full
// research screen. Each source loads and fails on its own, so one gap never blanks the card.

import { Badge, Card, ErrorState, KeyValuePair, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import {
  useCorporateStructure,
  useFundamentalMeasures,
  useInstrumentClassification,
  useInstrumentFeed,
} from '../../data/api';
import { moneyFromDto } from '../../data/api/mappers';
import type { MeasureValueDto } from '../../data/schemas';
import { companyResearchPath } from '../../routes/routes';
import { formatIsoDate, formatMoney } from '../format';
import styles from './CompanySummaryCard.module.scss';

const HEADLINE_IDS = ['price-to-earnings', 'return-on-equity', 'debt-to-equity'];
const MAX_FLAGS = 3;

function measureText(measure: MeasureValueDto): string {
  if (measure.value === null) return 'Not available';
  const suffix = measure.unit === 'percent' ? '%' : measure.unit === 'times' ? 'x' : '';
  return `${measure.value.toFixed(measure.unit === 'number' ? 2 : 1)}${suffix}`;
}

export interface CompanySummaryCardProps {
  readonly instrumentId: string;
  // The workspace shows the headline measures; Position Detail keeps the card short.
  readonly showMeasures?: boolean;
}

export function CompanySummaryCard({
  instrumentId,
  showMeasures = false,
}: CompanySummaryCardProps): ReactElement {
  const classification = useInstrumentClassification(instrumentId);
  const structure = useCorporateStructure(instrumentId);
  const measures = useFundamentalMeasures(instrumentId);
  const feed = useInstrumentFeed(instrumentId);
  const title = 'Company';

  if (classification.isError || structure.isError) {
    return (
      <Card title={title}>
        <ErrorState
          title="Company summary unavailable"
          message={classification.error?.message ?? structure.error?.message ?? 'Unknown error'}
          onRetry={() => {
            void classification.refetch();
            void structure.refetch();
          }}
        />
      </Card>
    );
  }
  if (classification.data === undefined || structure.data === undefined) {
    return (
      <Card title={title}>
        <LoadingState layout="detail" />
      </Card>
    );
  }

  const placement = classification.data;
  const heading =
    placement.kind === 'company' ? title : placement.kind === 'fund' ? 'Fund' : 'Asset';
  const parent = structure.data.parent;
  const derived = measures.data?.measures ?? null;
  const flags = derived?.flags ?? [];
  const nextEvent = feed.data?.upcomingEvents[0];
  const headline = (derived?.measures ?? []).filter((measure) => HEADLINE_IDS.includes(measure.id));

  return (
    <Card title={heading}>
      <div className={styles.stack}>
        <div className={styles.keyValues}>
          <KeyValuePair
            label={placement.kind === 'company' ? 'Sector and industry' : 'Asset class'}
            value={
              placement.sectorName === null
                ? (placement.assetClass ?? 'Not classified yet')
                : `${placement.sectorName} · ${placement.industryName ?? ''}`
            }
          />
          {parent !== null && (
            <KeyValuePair
              label="Parent"
              value={`${parent.name}${
                parent.sharePercent === null ? '' : ` (${parent.sharePercent.toFixed(1)}%)`
              }`}
            />
          )}
          {structure.data.groupName !== null && (
            <KeyValuePair label="Business group" value={structure.data.groupName} />
          )}
          {showMeasures && derived !== null && derived.marketCap !== null && (
            <KeyValuePair
              label="Market value"
              value={formatMoney(moneyFromDto(derived.marketCap), { compact: true })}
              isMono
            />
          )}
          {showMeasures &&
            headline.map((measure) => (
              <KeyValuePair
                key={measure.id}
                label={measure.label}
                value={`${measureText(measure)}${
                  measure.industryMedian === null
                    ? ''
                    : ` · industry ${measureText({ ...measure, value: measure.industryMedian })}`
                }`}
                isMono
              />
            ))}
        </div>

        {feed.isError ? (
          <span className={styles.meta}>Scheduled events are unavailable right now.</span>
        ) : nextEvent === undefined ? (
          feed.data !== undefined && <span className={styles.meta}>No scheduled event ahead.</span>
        ) : (
          <div className={styles.inline}>
            <span className={styles.meta}>Next: {formatIsoDate(nextEvent.date)}</span>
            <span>{nextEvent.title}</span>
            {nextEvent.inTradingRestrictionWindow && (
              <Badge variant="warning">In a restriction window</Badge>
            )}
          </div>
        )}

        {measures.isError ? (
          <span className={styles.meta}>Warning flags are unavailable right now.</span>
        ) : (
          flags.slice(0, MAX_FLAGS).map((flag) => (
            <div key={flag.id} className={styles.flag}>
              <span className={styles.inline}>
                <Badge variant={flag.severity === 'critical' ? 'critical' : 'warning'}>
                  {flag.severity === 'critical' ? 'Critical' : 'Warning'}
                </Badge>
                <span>{flag.title}</span>
              </span>
              <span className={styles.meta}>{flag.evidence}</span>
            </div>
          ))
        )}

        <Link to={companyResearchPath(instrumentId)} className={styles.link}>
          {placement.kind === 'company' ? 'Open company research' : 'Open research'}
        </Link>
      </div>
    </Card>
  );
}
