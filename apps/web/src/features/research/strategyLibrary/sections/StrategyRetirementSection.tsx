// Retirement criteria set at promotion, each strategy's standing against them, demotion history and
// correlation between strategies (E-08; requirements 28, 33; UI spec 19.2).

import { Badge, Card, ErrorState, LoadingState, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useStrategyLifecycles, useStrategyStanding } from '../../../../data/api';
import type {
  StrategyLifecycleDto,
  StrategyStandingDto,
  StrategyStandingViewDto,
} from '../../../../data/schemas';
import { formatDateTime, humanizeToken } from '../../../../shared/format';
import styles from './StrategyRetirement.module.scss';

function Criteria({
  lifecycle,
}: {
  readonly lifecycle: StrategyLifecycleDto | undefined;
}): ReactElement {
  const criteria = lifecycle?.criteria ?? null;
  if (criteria === null) return <span className={styles.meta}>None until promoted</span>;
  return (
    <span className={styles.meta}>
      Drawdown ≤ {String(criteria.maxDrawdownPercent)}%, {String(criteria.rollingWindowDays)}-day
      Sharpe ≥ {criteria.minRollingSharpe.toFixed(2)}, trails backtest ≤{' '}
      {String(criteria.maxUnderperformancePoints)} points; set at{' '}
      {humanizeToken(criteria.definedAtStage).toLowerCase()}
    </span>
  );
}

function Standing({ standing }: { readonly standing: StrategyStandingDto }): ReactElement {
  if (standing.measured === null) return <span className={styles.meta}>Not measured</span>;
  const { measured } = standing;
  return (
    <span className={styles.stack}>
      <span>
        Drawdown {measured.drawdownPercent.toFixed(1)}%, Sharpe {measured.rollingSharpe.toFixed(2)},
        trails by {measured.underperformancePoints.toFixed(1)} points
      </span>
      <span className={styles.meta}>
        {standing.source === 'live'
          ? 'From open positions'
          : 'Recorded at demotion; no positions since'}
      </span>
      {standing.breaches.length === 0 ? (
        <Badge variant="positive">Within criteria</Badge>
      ) : (
        <span className={styles.high}>{standing.breaches.join('; ')}</span>
      )}
    </span>
  );
}

function CorrelationTable({ view }: { readonly view: StrategyStandingViewDto }): ReactElement {
  const { correlation, correlationWarning } = view;
  if (correlation.strategyIds.length < 2) {
    return (
      <p className={styles.meta}>
        Fewer than two strategies hold positions, so there is nothing to compare.
      </p>
    );
  }
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{correlation.windowDays}-day daily returns</th>
            {correlation.names.map((name) => (
              <th key={name} scope="col" className={styles.numeric}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {correlation.matrix.map((row, i) => (
            <tr key={correlation.strategyIds[i]}>
              <th scope="row">{correlation.names[i]}</th>
              {row.map((value, j) => (
                <td
                  key={correlation.strategyIds[j]}
                  className={cx(
                    styles.numeric,
                    i !== j && Math.abs(value) > correlationWarning ? styles.high : undefined,
                  )}
                >
                  {value.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StrategyRetirementSection(): ReactElement {
  const standing = useStrategyStanding();
  const lifecycles = useStrategyLifecycles();

  const body = ((): ReactElement => {
    const failed = [standing, lifecycles].find((query) => query.isError);
    if (failed !== undefined) {
      return (
        <ErrorState
          title="Strategy standing unavailable"
          message={failed.error?.message ?? 'The request failed.'}
          onRetry={() => {
            void standing.refetch();
            void lifecycles.refetch();
          }}
        />
      );
    }
    if (standing.data === undefined || lifecycles.data === undefined) {
      return <LoadingState layout="table" count={4} />;
    }
    const view = standing.data;
    const demotions = lifecycles.data.flatMap((lifecycle) =>
      lifecycle.history
        .filter((change) => change.kind === 'demotion')
        .map((change) => ({ lifecycle, change })),
    );
    const correlated = view.correlation.matrix.some((row, i) =>
      row.some((value, j) => i < j && Math.abs(value) > view.correlationWarning),
    );
    return (
      <div className={styles.stack}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Strategy</th>
                <th scope="col">Retirement criteria</th>
                <th scope="col">Standing</th>
                <th scope="col">Next review</th>
              </tr>
            </thead>
            <tbody>
              {view.standings.map((item) => (
                <tr key={String(item.strategyId)}>
                  <th scope="row">
                    {item.name}
                    <br />
                    <span className={styles.meta}>{humanizeToken(item.stage)}</span>
                  </th>
                  <td>
                    <Criteria
                      lifecycle={lifecycles.data.find(
                        (lifecycle) => String(lifecycle.strategyId) === String(item.strategyId),
                      )}
                    />
                  </td>
                  <td>
                    <Standing standing={item} />
                  </td>
                  <td>
                    {item.nextReviewOn === null ? (
                      <span className={styles.meta}>—</span>
                    ) : (
                      <span className={item.isReviewOverdue ? styles.high : undefined}>
                        {String(item.nextReviewOn)}
                        {item.isReviewOverdue ? ' (overdue)' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className={styles.heading}>Demotion history</h3>
        {demotions.length === 0 ? (
          <p className={styles.meta}>No strategy has been demoted.</p>
        ) : (
          <ul className={styles.list}>
            {demotions.map(({ lifecycle, change }) => (
              <li key={`${String(lifecycle.strategyId)}-${String(change.at)}`}>
                <span className={styles.heading}>
                  {
                    view.standings.find(
                      (item) => String(item.strategyId) === String(lifecycle.strategyId),
                    )?.name
                  }
                </span>{' '}
                {humanizeToken(change.from ?? 'draft')} → {humanizeToken(change.to)},{' '}
                {formatDateTime(change.at)}
                <p className={styles.meta}>{change.reason}</p>
              </li>
            ))}
          </ul>
        )}

        <h3 className={styles.heading}>Correlation between strategies</h3>
        {correlated && (
          <p className={styles.high}>
            Some strategies move together above {view.correlationWarning.toFixed(2)}, so they are
            not as independent as their separate limits assume.
          </p>
        )}
        <CorrelationTable view={view} />
      </div>
    );
  })();

  return <Card title="Retirement criteria, standing and correlation">{body}</Card>;
}
