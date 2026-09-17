import { AnalyticalChart, Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api';
import type { PortfolioPerformanceDto } from '../../../../data/schemas';
import { formatMoney, formatPercentage } from '../../../../shared/format';
import { ROUTES } from '../../../../routes/routes';
import styles from '../Performance.module.scss';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const tone = (value: number | null): string | undefined =>
  value === null || value === 0 ? undefined : value > 0 ? styles.gain : styles.loss;

// Portfolio performance at a glance: returns for standard periods, value since the first purchase,
// monthly returns and contribution by holding. The performance report covers chosen periods,
// comparisons, export and schedules.
export function PerformanceView({
  data,
}: {
  readonly data: PortfolioPerformanceDto;
}): ReactElement {
  const years = [...new Set(data.monthly.map((item) => String(item.year)))];
  const heatmap = {
    years,
    months: MONTHS,
    data: data.monthly.map(
      (item) =>
        [item.month - 1, years.indexOf(String(item.year)), item.returnPercent] as [
          number,
          number,
          number,
        ],
    ),
  };

  return (
    <div className={styles.page}>
      <ul className={styles.periods} aria-label="Returns by period">
        {data.periods.map((period) => (
          <li key={period.id} className={styles.period}>
            <span className={styles.fieldLabel}>{period.label}</span>
            <span className={cx(styles.big, tone(period.returnPercent))}>
              {period.returnPercent === null
                ? '—'
                : formatPercentage(period.returnPercent, { decimals: 2, signed: true })}
            </span>
            <span className={cx(styles.meta, tone(Number(period.gain.amount)))}>
              {formatMoney(moneyFromDto(period.gain), { signed: true })} gain or loss
            </span>
            <Link
              to={`${ROUTES.REPORTS_PERFORMANCE}?from=${period.from}&to=${period.to}`}
              className={styles.meta}
            >
              {period.from} to {period.to}: full report
            </Link>
          </li>
        ))}
      </ul>
      <p className={styles.meta}>
        Returns are time-weighted: they measure the investments, not when money was added, so a
        return and a money gain can point in different directions.{' '}
        <Link to={ROUTES.REPORTS_PERFORMANCE}>Open the performance report</Link> for other periods,
        benchmark comparison and export.
      </p>

      <Card
        title="Value since the first purchase"
        extra={<span className={styles.meta}>Weekly, from {data.inception}</span>}
      >
        <AnalyticalChart
          preset="equity-curve"
          data={{
            dates: data.series.map((point) => point.date),
            equity: data.series.map((point) => point.value),
          }}
          height={280}
        />
        <p className={styles.meta}>
          {formatMoney(moneyFromDto(data.value))} at the {data.asOf} close. Rises include money
          added, so read growth from the returns above.
        </p>
      </Card>

      <Card
        title="Monthly returns"
        extra={<span className={styles.meta}>{data.monthly.length} months</span>}
      >
        <AnalyticalChart
          preset="monthly-returns-heatmap"
          data={heatmap}
          height={Math.max(200, 60 + years.length * 36)}
        />
        <p className={styles.meta}>
          Each cell is that month&apos;s time-weighted return; the colour runs from loss to gain and
          the value is shown on hover.
        </p>
      </Card>

      <Card
        title="Contribution by holding"
        extra={<span className={styles.meta}>Since the first purchase</span>}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Holding</th>
              <th scope="col" className={styles.end}>
                Gain or loss
              </th>
              <th scope="col" className={styles.end}>
                Share of the total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.contributions.map((item) => (
              <tr key={item.instrumentId}>
                <th scope="row">{item.symbol}</th>
                <td className={cx(styles.end, tone(Number(item.gain.amount)))}>
                  {formatMoney(moneyFromDto(item.gain), { signed: true })}
                </td>
                <td className={styles.end}>
                  {item.sharePercent === null ? '—' : `${item.sharePercent.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.meta}>
          Shares are of the size of the total gain or loss and keep each holding&apos;s sign, so
          they add up to −100% when the total is a loss.
        </p>
      </Card>
    </div>
  );
}
