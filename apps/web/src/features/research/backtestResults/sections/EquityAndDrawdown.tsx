import { AnalyticalChart, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import type { BacktestDetailDto } from '../../../../data/schemas';
import styles from '../BacktestResults.module.scss';

export interface EquityAndDrawdownProps {
  readonly detail: BacktestDetailDto;
}

// UI spec 7.10 — equity curve with the benchmark overlaid, and the drawdown chart aligned beneath it
// on the same dates.
export function EquityAndDrawdown({ detail }: EquityAndDrawdownProps): ReactElement {
  const dates = useMemo(() => detail.equityCurve.map((point) => point.date), [detail.equityCurve]);
  const equityData = useMemo(
    () => ({
      dates,
      equity: detail.equityCurve.map((point) => Math.round(point.equity)),
      benchmark: detail.equityCurve.map((point) => Math.round(point.benchmark ?? 0)),
    }),
    [dates, detail.equityCurve],
  );
  const drawdownData = useMemo(
    () => ({ dates, drawdowns: detail.equityCurve.map((point) => point.drawdownPercent) }),
    [dates, detail.equityCurve],
  );
  const worst = detail.equityCurve.reduce(
    (lowest, point) => (point.drawdownPercent < lowest.drawdownPercent ? point : lowest),
    detail.equityCurve[0] ?? { date: '', drawdownPercent: 0 },
  );

  return (
    <div className={styles.chartStack}>
      <Card
        title="Equity curve"
        extra={
          <span className={styles.meta}>
            Strategy against {detail.benchmarkLabel ?? 'no benchmark'}
          </span>
        }
      >
        <AnalyticalChart preset="equity-curve" data={equityData} height={300} />
        <p className={styles.meta}>
          Weekly closing equity from {dates[0]} to {dates[dates.length - 1]}, after modelled costs.
        </p>
      </Card>
      <Card
        title="Drawdown"
        extra={
          <span className={styles.meta}>
            Worst {worst.drawdownPercent.toFixed(2)}% on {worst.date}
          </span>
        }
      >
        <AnalyticalChart preset="underwater-drawdown" data={drawdownData} height={200} />
        <p className={styles.meta}>
          How far below its previous peak the strategy was, on the same dates as the equity curve.
        </p>
      </Card>
    </div>
  );
}
