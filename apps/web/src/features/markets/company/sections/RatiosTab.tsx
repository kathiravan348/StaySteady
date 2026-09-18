// Ratios tab (UI spec 20.1): the derived measures grouped by what they answer, each with its own
// trend, the industry median beside it and the inputs behind it on request, then a peer comparison.

import { Badge, Card, ErrorState, LoadingState, Sparkline } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useFinancialStatements, useFundamentalMeasures } from '../../../../data/api';
import type { MeasureValueDto, StatementBasis } from '../../../../data/schemas';
import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import styles from '../CompanyResearch.module.scss';
import type { MeasureGroupId } from '../model/ratioRows';
import {
  GROUP_DESCRIPTION,
  GROUP_TITLE,
  MEASURE_GROUPS,
  measuresInGroup,
  STANDING_LABEL,
  standingAgainstMedian,
  trendSeries,
} from '../model/ratioRows';
import { PeerComparison } from './PeerComparison';
import type { CompanySectionProps } from './ProfileSection';
import { formatMeasure } from './StandingSection';

function MeasureRow({ measure }: { readonly measure: MeasureValueDto }): ReactElement {
  const trend = trendSeries(measure);
  const standing = standingAgainstMedian(measure);
  return (
    <tr>
      <th scope="row">
        <span className={styles.stack}>
          <span>{measure.label}</span>
          {measure.note !== null && <span className={styles.meta}>{measure.note}</span>}
        </span>
      </th>
      <td className={styles.numberCell}>{formatMeasure(measure, measure.value)}</td>
      <td>
        {trend.length < 2 ? (
          <span className={styles.meta}>{trend.length === 0 ? 'No history' : 'Latest only'}</span>
        ) : (
          <Sparkline
            data={trend}
            direction="neutral"
            role="img"
            aria-label={`${measure.label} over ${String(trend.length)} years: ${trend
              .map((value) => formatMeasure(measure, value))
              .join(', ')}`}
          />
        )}
      </td>
      <td className={styles.numberCell}>
        {measure.industryMedian === null
          ? '—'
          : `${formatMeasure(measure, measure.industryMedian)} (${String(measure.peerCount)})`}
      </td>
      <td>
        <Badge variant={standing === 'unknown' ? 'neutral' : 'info'}>
          {STANDING_LABEL[standing]}
        </Badge>
      </td>
      <td>
        <details className={styles.inputs}>
          <summary>Inputs</summary>
          <span className={styles.evidence}>{measure.inputs}</span>
          {measure.periods.length > 0 && (
            <span className={styles.meta}>Periods: {measure.periods.join(', ')}</span>
          )}
        </details>
      </td>
    </tr>
  );
}

function GroupCard({
  group,
  measures,
}: {
  readonly group: MeasureGroupId;
  readonly measures: readonly MeasureValueDto[];
}): ReactElement {
  return (
    <Card title={GROUP_TITLE[group]}>
      <div className={styles.stack}>
        <p className={styles.description}>{GROUP_DESCRIPTION[group]}</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Latest</th>
                <th scope="col">Trend</th>
                <th scope="col">Industry median (peers)</th>
                <th scope="col">Against median</th>
                <th scope="col">Computed from</th>
              </tr>
            </thead>
            <tbody>
              {measures.map((measure) => (
                <MeasureRow key={measure.id} measure={measure} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

export function RatiosTab({ instrumentId }: CompanySectionProps): ReactElement {
  const [basis, setBasis] = useState<StatementBasis>('consolidated');
  const statements = useFinancialStatements(instrumentId);
  const bases = statements.data?.statements?.basesAvailable ?? ['consolidated'];
  const activeBasis = bases.includes(basis) ? basis : 'consolidated';
  const measures = useFundamentalMeasures(instrumentId, activeBasis);

  if (measures.isError) {
    return (
      <ErrorState
        title="Ratios unavailable"
        message={measures.error.message}
        onRetry={() => {
          void measures.refetch();
        }}
      />
    );
  }
  if (measures.data === undefined) {
    return <LoadingState layout="table" count={8} />;
  }
  const derived = measures.data.measures;
  if (derived === null) {
    return (
      <Card title="Ratios">
        <p className={styles.description}>{measures.data.unavailableReason}</p>
      </Card>
    );
  }

  return (
    <div className={styles.stack}>
      <div className={styles.inline}>
        {bases.length > 1 && (
          <ToggleGroup
            label="Basis"
            options={bases}
            value={activeBasis}
            onChange={setBasis}
            formatOption={(option) => (option === 'consolidated' ? 'Consolidated' : 'Standalone')}
          />
        )}
        <Badge variant="neutral">As reported to {derived.latestPeriod}</Badge>
        <span className={styles.meta}>
          {derived.industryName === null
            ? 'Not classified into an industry, so there is no median to compare with.'
            : `Industry: ${derived.industryName}`}
        </span>
      </div>
      <p className={styles.evidence}>{derived.note}</p>
      <span className={styles.meta}>
        Medians and standings are observations, not advice: whether higher is better depends on the
        measure. {derived.source}, as of {derived.asOf}.
      </span>

      {MEASURE_GROUPS.map((group) => {
        const inGroup = measuresInGroup(derived.measures, group);
        return inGroup.length === 0 ? null : (
          <GroupCard key={group} group={group} measures={inGroup} />
        );
      })}

      <PeerComparison company={derived} basis={activeBasis} />
    </div>
  );
}
