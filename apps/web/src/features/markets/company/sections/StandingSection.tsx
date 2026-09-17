// Classification, group and the headline measures against the industry (UI spec 20.1).
// Every measure is shown beside its industry median, because a ratio on its own decides nothing.

import { Badge, Card, ErrorState, KeyValuePair, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import {
  useCorporateStructure,
  useFundamentalMeasures,
  useInstrumentClassification,
} from '../../../../data/api';
import type { MeasureValueDto } from '../../../../data/schemas';
import { formatMoney } from '../../../../shared/format';
import { moneyFromDto } from '../../../../data/api/mappers';
import { companyResearchPath } from '../../../../routes/routes';
import styles from '../CompanyResearch.module.scss';
import type { CompanySectionProps } from './ProfileSection';

const HEADLINE_IDS = [
  'price-to-earnings',
  'return-on-equity',
  'debt-to-equity',
  'revenue-growth-3y',
  'cash-conversion',
];

export function formatMeasure(measure: MeasureValueDto, value: number | null): string {
  if (value === null) return 'Not available';
  switch (measure.unit) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'times':
      return `${value.toFixed(1)}x`;
    case 'number':
      return value.toFixed(2);
  }
}

function MeasureTile({ measure }: { readonly measure: MeasureValueDto }): ReactElement {
  const median = measure.industryMedian;
  return (
    <div className={styles.measure}>
      <span className={styles.meta}>{measure.label}</span>
      <span className={styles.measureValue}>{formatMeasure(measure, measure.value)}</span>
      <span className={styles.meta}>
        {median === null
          ? `No industry median yet (${String(measure.peerCount)} peers covered)`
          : `Industry median ${formatMeasure(measure, median)} over ${String(measure.peerCount)} peers`}
      </span>
    </div>
  );
}

export function StandingSection({ instrumentId }: CompanySectionProps): ReactElement {
  const classification = useInstrumentClassification(instrumentId);
  const structure = useCorporateStructure(instrumentId);
  const measures = useFundamentalMeasures(instrumentId);

  if (classification.isError || structure.isError || measures.isError) {
    const failed = [classification, structure, measures].find((query) => query.isError);
    return (
      <Card title="Standing">
        <ErrorState
          title="Standing unavailable"
          message={failed?.error?.message ?? 'Unknown error'}
          onRetry={() => {
            void classification.refetch();
            void structure.refetch();
            void measures.refetch();
          }}
        />
      </Card>
    );
  }
  if (
    classification.data === undefined ||
    structure.data === undefined ||
    measures.data === undefined
  ) {
    return (
      <Card title="Standing">
        <LoadingState layout="cards" count={4} />
      </Card>
    );
  }

  const derived = measures.data.measures;
  const headline = (derived?.measures ?? []).filter((measure) => HEADLINE_IDS.includes(measure.id));

  return (
    <Card title="Standing">
      <div className={styles.stack}>
        <div className={styles.keyValues}>
          <KeyValuePair
            label="Sector and industry"
            value={
              classification.data.sectorName === null
                ? (classification.data.assetClass ?? 'Not classified')
                : `${classification.data.sectorName} · ${classification.data.industryName ?? ''}`
            }
          />
          <KeyValuePair
            label="Business group"
            value={structure.data.groupName ?? 'No business group'}
          />
          {structure.data.parent !== null && (
            <KeyValuePair
              label="Parent"
              value={`${structure.data.parent.name}${
                structure.data.parent.sharePercent === null
                  ? ''
                  : ` (${structure.data.parent.sharePercent.toFixed(1)}%)`
              }`}
            />
          )}
          {derived !== null && (
            <KeyValuePair
              label="Market value"
              value={
                derived.marketCap === null
                  ? 'Not comparable in the reporting currency'
                  : formatMoney(moneyFromDto(derived.marketCap), { compact: true })
              }
              isMono
            />
          )}
        </div>

        {structure.data.related.length > 0 && (
          <div className={styles.stack}>
            <span className={styles.meta}>Listed relatives in the same group</span>
            <ul className={styles.list}>
              {structure.data.related.map((related) => (
                <li key={related.name} className={styles.inline}>
                  {related.instrumentId === null ? (
                    <span>{related.name}</span>
                  ) : (
                    <Link to={companyResearchPath(related.instrumentId)}>{related.name}</Link>
                  )}
                  <Badge variant="neutral">{related.relation.replaceAll('_', ' ')}</Badge>
                  {related.sharePercent !== null && (
                    <span className={styles.meta}>{related.sharePercent.toFixed(1)}% held</span>
                  )}
                  {!related.isListed && <span className={styles.meta}>Not listed</span>}
                </li>
              ))}
            </ul>
            <span className={styles.evidence}>{structure.data.note}</span>
          </div>
        )}

        {derived === null ? (
          <p className={styles.description}>{measures.data.unavailableReason}</p>
        ) : (
          <div className={styles.stack}>
            <div className={styles.measureGrid}>
              {headline.map((measure) => (
                <MeasureTile key={measure.id} measure={measure} />
              ))}
            </div>
            <span className={styles.meta}>{derived.note}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
