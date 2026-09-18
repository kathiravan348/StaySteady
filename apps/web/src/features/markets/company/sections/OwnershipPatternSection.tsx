// Who owns the company over time, and how much of the promoter's block is pledged (UI spec 20.1).
// A rising pledge is emphasised, because it is how a controlling holder's borrowing shows up first.

import { AnalyticalChart, Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useInstrumentOwnership } from '../../../../data/api';
import type { InstrumentOwnershipDto } from '../../../../data/schemas';
import { formatIsoDate } from '../../../../shared/format';
import styles from '../CompanyResearch.module.scss';
import { InsiderSection } from './InsiderSection';
import type { CompanySectionProps } from './ProfileSection';

function pledgeSeries(ownership: InstrumentOwnershipDto): number[] {
  return ownership.points.flatMap((point) =>
    point.promoterPledgePercent === null ? [] : [point.promoterPledgePercent],
  );
}

function PledgeTrend({ ownership }: { readonly ownership: InstrumentOwnershipDto }): ReactElement {
  const pledges = pledgeSeries(ownership);
  const first = pledges[0];
  const latest = pledges[pledges.length - 1];
  if (!ownership.reportsPromoterHolding || first === undefined || latest === undefined) {
    return (
      <p className={styles.description}>
        No promoter pledge is reported for this market, which is different from a pledge of zero.
      </p>
    );
  }
  const isRising = latest > first;
  return (
    <div className={styles.stack}>
      <div className={styles.inline}>
        <span className={styles.measureValue}>{latest.toFixed(1)}%</span>
        <span className={styles.meta}>of the promoter holding pledged</span>
        {isRising ? (
          <Badge variant="negative">Rising</Badge>
        ) : (
          <Badge variant="neutral">{latest === 0 ? 'None pledged' : 'Not rising'}</Badge>
        )}
      </div>
      {isRising && (
        <span className={styles.evidence}>
          Up from {first.toFixed(1)}% eight quarters ago. Pledged shares can be sold by the lender
          if the price falls, whatever the promoter intends.
        </span>
      )}
      {latest > 0 && (
        <AnalyticalChart
          preset="rolling-metric"
          data={{
            dates: ownership.points.map((point) => point.periodEnd),
            series: [{ name: 'Pledged', values: pledges }],
            unit: '%',
          }}
          height={180}
        />
      )}
    </div>
  );
}

export function OwnershipPatternSection({ instrumentId }: CompanySectionProps): ReactElement {
  const ownership = useInstrumentOwnership(instrumentId);

  if (ownership.isError) {
    return (
      <Card title="Ownership">
        <ErrorState
          title="Ownership unavailable"
          message={ownership.error.message}
          onRetry={() => {
            void ownership.refetch();
          }}
        />
      </Card>
    );
  }
  if (ownership.data === undefined) {
    return (
      <Card title="Ownership">
        <LoadingState layout="chart" />
      </Card>
    );
  }
  const pattern = ownership.data.ownership;
  if (pattern === null) {
    return (
      <Card title="Ownership">
        <p className={styles.description}>{ownership.data.unavailableReason}</p>
      </Card>
    );
  }

  const holders = [
    ...(pattern.reportsPromoterHolding
      ? [
          {
            name: 'Promoter',
            values: pattern.points.map((point) => point.promoterPercent ?? 0),
          },
        ]
      : []),
    {
      name: 'Foreign institutions',
      values: pattern.points.map((point) => point.foreignInstitutionalPercent),
    },
    {
      name: 'Domestic institutions',
      values: pattern.points.map((point) => point.domesticInstitutionalPercent),
    },
    { name: 'Public', values: pattern.points.map((point) => point.publicPercent) },
  ];

  return (
    <div className={styles.stack}>
      <Card title="Ownership over time">
        <div className={styles.stack}>
          <AnalyticalChart
            preset="stacked-area"
            data={{
              dates: pattern.points.map((point) => point.periodEnd),
              series: holders,
              percent: true,
            }}
            height={260}
          />
          <span className={styles.evidence}>{pattern.note}</span>
          <span className={styles.meta}>
            {pattern.source}, to {formatIsoDate(pattern.asOf)}.
          </span>
        </div>
      </Card>
      <Card title="Promoter pledge">
        <PledgeTrend ownership={pattern} />
      </Card>
      <InsiderSection ownership={pattern} />
    </div>
  );
}
