import { Badge, Card, ErrorState, LoadingState, UsageMeter } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto } from '../../../data/api/mappers';
import { useSourceReliability } from '../../../data/api';
import type { ReliabilityPeriodDto, SourceReliabilityDto } from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import { createMoney } from '../../../shared/money';
import { ToggleGroup } from '../../../shared/ui/ToggleGroup';
import styles from '../Health.module.scss';

const PERIODS: readonly ReliabilityPeriodDto[] = ['7d', '30d', '90d'];
const PERIOD_LABELS: Readonly<Record<ReliabilityPeriodDto, string>> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

function UptimeStrip({ source }: { readonly source: SourceReliabilityDto }): ReactElement {
  const interrupted = source.days.filter((day) => day.uptimePercent < 100);
  const lowest = Math.min(...source.days.map((day) => day.uptimePercent));
  const summary = `${source.days.length} days: ${source.days.length - interrupted.length} fully up, ${interrupted.length} with interruptions, lowest ${lowest.toFixed(1)}%`;
  return (
    <ol className={styles.strip} aria-label={summary}>
      {source.days.map((day) => (
        <li
          key={day.date}
          aria-hidden="true"
          title={`${day.date}: ${day.uptimePercent.toFixed(2)}% up`}
          className={`${styles.day} ${day.uptimePercent < 95 ? styles.dayOutage : day.uptimePercent < 100 ? styles.dayDip : ''}`}
        />
      ))}
    </ol>
  );
}

function SourceCard({ source }: { readonly source: SourceReliabilityDto }): ReactElement {
  const budget = moneyFromDto(source.costBudget);
  const used = moneyFromDto(source.costUsed);
  const uptimeVariant =
    source.uptimePercent >= 99.5 ? 'positive' : source.uptimePercent >= 98 ? 'warning' : 'critical';
  return (
    <Card
      title={source.name}
      extra={<Badge variant={uptimeVariant}>{source.uptimePercent.toFixed(2)}% uptime</Badge>}
    >
      <div className={styles.cardBody}>
        <UptimeStrip source={source} />
        <div className={styles.factRow}>
          <span>
            <strong>{source.failureCount}</strong> days with failures
          </span>
          {source.kind === 'provider' && (
            <span>
              <strong>{source.failoverCount}</strong> failovers
            </span>
          )}
        </div>
        <UsageMeter
          label="Requests this month"
          used={source.requestsUsed}
          limit={source.requestLimit}
        />
        <UsageMeter
          label="Cost this month"
          used={used.amount.toNumber()}
          limit={budget.amount.toNumber()}
          formatValue={(value) =>
            formatMoney(createMoney(value.toFixed(2), budget.currency), { showCurrency: 'code' })
          }
        />
      </div>
    </Card>
  );
}

// UI spec 7.15 — provider and broker reliability over selectable periods, with usage headroom.
export function ReliabilityPanel(): ReactElement {
  const [period, setPeriod] = useState<ReliabilityPeriodDto>('30d');
  const reliability = useSourceReliability(period);

  let body: ReactElement;
  if (reliability.data === undefined) {
    body = reliability.isError ? (
      <ErrorState
        title="Reliability history unavailable"
        message={reliability.error.message}
        onRetry={() => {
          void reliability.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={4} />
    );
  } else {
    const groups = [
      {
        title: 'Data providers',
        items: reliability.data.filter((source) => source.kind === 'provider'),
      },
      { title: 'Brokers', items: reliability.data.filter((source) => source.kind === 'broker') },
    ];
    body = (
      <div className={styles.section}>
        {groups.map((group) => (
          <section key={group.title} className={styles.section} aria-label={group.title}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <div className={styles.cardGrid}>
              {group.items.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.toolbar}>
        <ToggleGroup
          label="Uptime period"
          options={PERIODS}
          value={period}
          onChange={setPeriod}
          formatOption={(option) => PERIOD_LABELS[option]}
        />
        <span className={styles.meta}>Usage and cost cover the current month.</span>
      </div>
      {body}
    </div>
  );
}
