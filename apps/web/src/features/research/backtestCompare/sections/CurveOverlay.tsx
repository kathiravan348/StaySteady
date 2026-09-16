import { AnalyticalChart, Card, useChartTheme } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ComparedRun } from '../model/compareModel';
import { NORMALISED_START, normaliseCurves } from '../model/compareModel';
import styles from '../BacktestCompare.module.scss';

export interface CurveOverlayProps {
  readonly runs: readonly ComparedRun[];
}

// UI spec 7.11 — equity curves normalised to a common start, so runs of different sizes and periods
// can be read against each other. The legend uses the chart's own palette, in the same order.
export function CurveOverlay({ runs }: CurveOverlayProps): ReactElement {
  const theme = useChartTheme();
  const curves = normaliseCurves(runs);

  return (
    <Card
      title="Equity curves, normalised"
      extra={<span className={styles.meta}>Every run starts at {NORMALISED_START}</span>}
    >
      <ul className={styles.legend}>
        {curves.series.map((series, index) => (
          <li key={series.name} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ backgroundColor: theme.palette[index % theme.palette.length] }}
              aria-hidden="true"
            />
            {series.name}
          </li>
        ))}
      </ul>
      <AnalyticalChart
        preset="comparison-curves"
        data={{ dates: curves.dates, series: curves.series, baseline: NORMALISED_START }}
        height={360}
      />
      <p className={styles.note}>
        Each line is that run&apos;s equity divided by its own starting capital, so the comparison
        is about shape and not size. Where a run has no data for a date its last known value is
        carried forward.
      </p>
    </Card>
  );
}
