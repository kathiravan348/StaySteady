import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useDataFreshness } from '../../../data/api';
import { useMarketSchedule } from '../../../providers/MarketScheduleProvider';
import type { MarketSessionState } from '../../../shared/marketTime';
import { evaluateFreshness, formatAge, FRESHNESS_META } from '../model/healthModel';
import styles from '../Health.module.scss';
import { useNow } from '../useNow';

// UI spec 7.15 — how old the newest data is per market and provider, versus what is expected.
export function FreshnessPanel(): ReactElement {
  const freshness = useDataFreshness();
  const { marketStatuses } = useMarketSchedule();
  const now = useNow();
  const marketStates = useMemo(
    () =>
      new Map<string, MarketSessionState>(
        marketStatuses.map((status) => [status.marketId, status.state]),
      ),
    [marketStatuses],
  );

  let body: ReactElement;
  if (freshness.data === undefined) {
    body = freshness.isError ? (
      <ErrorState
        title="Freshness checks unavailable"
        message={freshness.error.message}
        onRetry={() => {
          void freshness.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={5} />
    );
  } else {
    body = (
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>
            Newest data age per market and provider
          </caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col" className={styles.numeric}>
                Newest data
              </th>
              <th scope="col" className={styles.numeric}>
                Expected within
              </th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {freshness.data.map((item) => {
              const { state, ageSeconds } = evaluateFreshness(
                item,
                now,
                item.marketId === null ? null : (marketStates.get(item.marketId) ?? null),
              );
              const meta = FRESHNESS_META[state];
              return (
                <tr key={item.id}>
                  <th scope="row">
                    <span className={styles.stack}>
                      <span>{item.name}</span>
                      <span className={styles.meta}>
                        {item.scope === 'market' ? 'Market' : 'Provider'}
                      </span>
                    </span>
                  </th>
                  <td className={styles.numeric}>{formatAge(ageSeconds)} ago</td>
                  <td className={styles.numeric}>{formatAge(item.expectedMaxAgeSeconds)}</td>
                  <td>
                    <Badge variant={meta.variant}>
                      <span aria-hidden="true">{meta.icon}</span> {meta.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Card title="Data freshness">
      {freshness.isError && freshness.data !== undefined && (
        <p className={styles.warningText} role="alert">
          Latest freshness check failed; ages below keep counting from the last known data.
        </p>
      )}
      {body}
    </Card>
  );
}
