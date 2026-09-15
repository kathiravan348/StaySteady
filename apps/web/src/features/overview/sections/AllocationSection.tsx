import { AnalyticalChart, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { formatMoney } from '../../../shared/format';
import { ALLOCATION_DIMENSIONS, humanizeToken } from '../model/overviewLists';
import type { AllocationBreakdown, AllocationDimension } from '../model/overviewTypes';
import { ToggleGroup } from '../../../shared/ui/ToggleGroup';
import styles from './sections.module.scss';

export interface AllocationSectionProps {
  readonly allocation: AllocationBreakdown;
}

// UI spec 7.1 — switchable allocation breakdown. Sector and strategy are not in the data yet.
// The list beside the chart is the accessible data alternative (UI spec 13).
export function AllocationSection({ allocation }: AllocationSectionProps): ReactElement {
  const [dimension, setDimension] = useState<AllocationDimension>('country');
  const slices = allocation[dimension];
  const sharesKey = slices.map((slice) => `${slice.label}:${slice.percent}`).join('|');
  // Rebuild chart data only when rounded shares change, so live price ticks do not redraw it.
  const chartData = useMemo(
    () => ({ items: slices.map((slice) => ({ name: slice.label, value: slice.percent })) }),
    [sharesKey],
  );

  return (
    <Card
      title="Allocation"
      extra={
        <ToggleGroup
          label="Allocation breakdown"
          options={ALLOCATION_DIMENSIONS}
          value={dimension}
          onChange={setDimension}
          formatOption={humanizeToken}
        />
      }
    >
      <div className={styles.columns}>
        <AnalyticalChart preset="allocation-donut" data={chartData} height={220} />
        <ul className={styles.list} aria-label={`Allocation by ${dimension}`}>
          {slices.map((slice) => (
            <li key={slice.label} className={styles.row}>
              <span className={styles.rowTitle}>{slice.label}</span>
              <span className={styles.rowValue}>
                <span>{slice.percent.toFixed(1)}%</span>
                <span className={styles.meta}>{formatMoney(slice.value, { compact: true })}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
