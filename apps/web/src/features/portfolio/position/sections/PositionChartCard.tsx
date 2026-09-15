import { Card, ErrorState, LoadingState, PriceChart } from '@staysteady/ui';
import type { PriceBarData } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { usePriceHistories } from '../../../../data/api';
import { formatMoney, pluralize } from '../../../../shared/format';
import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import type { ExitInfo, HoldingRow } from '../../holdings/model/holdingTypes';
import { buildPositionMarkers, buildPriceLevels } from '../model/chartMarkers';
import type { LedgerEntry } from '../model/positionTypes';
import styles from '../PositionPage.module.scss';

export interface PositionChartCardProps {
  readonly row: HoldingRow;
  readonly exit: ExitInfo | null;
  readonly ledger: readonly LedgerEntry[];
}

const RANGES = ['3M', '1Y', 'All'] as const;
type ChartRange = (typeof RANGES)[number];
const RANGE_BARS: Readonly<Record<ChartRange, number | null>> = { '3M': 63, '1Y': 252, All: null };
const RANGE_LABELS: Readonly<Record<ChartRange, string>> = {
  '3M': '3 months',
  '1Y': '1 year',
  All: 'All history',
};

// UI spec 7.3 — chart with entry and exit markers plotted on it.
export function PositionChartCard({ row, exit, ledger }: PositionChartCardProps): ReactElement {
  const { instrument } = row;
  const [range, setRange] = useState<ChartRange>('All');
  const ids = useMemo(() => [instrument.id], [instrument.id]);
  const prices = usePriceHistories(ids);
  const history = prices.histories.get(instrument.id);

  const chart = useMemo(() => {
    if (history === undefined) {
      return null;
    }
    const count = RANGE_BARS[range];
    const visible = count === null ? history : history.slice(-count);
    const dates = visible.map((bar) => bar.timestamp.slice(0, 10));
    const bars: PriceBarData[] = visible.map((bar, index) => ({
      time: dates[index] ?? bar.timestamp.slice(0, 10),
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
    }));
    return { bars, ...buildPositionMarkers(row.lots, ledger, dates) };
  }, [history, range, row.lots, ledger]);

  const levels = useMemo(() => buildPriceLevels(exit, row.averageCost), [exit, row.averageCost]);

  let body: ReactElement;
  if (prices.error !== null) {
    body = (
      <ErrorState
        title="Price history unavailable"
        message={prices.error.message}
        onRetry={prices.refetch}
      />
    );
  } else if (chart === null) {
    body = <LoadingState layout="table" count={4} />;
  } else {
    const purchases = chart.markers.filter((marker) => marker.shape === 'arrowUp').length;
    const sales = chart.markers.length - purchases;
    body = (
      <>
        <PriceChart
          data={chart.bars}
          seriesType="candlestick"
          showVolume={false}
          height={360}
          markers={chart.markers}
          priceLevels={levels}
          ariaLabel={`${instrument.symbol} daily prices, ${RANGE_LABELS[range]}, with ${pluralize(
            purchases,
            'purchase',
          )} and ${pluralize(sales, 'sale')} marked`}
        />
        <ul className={styles.legend} aria-label="Chart legend">
          <li>▲ below a bar: purchase ({purchases})</li>
          <li>▼ above a bar: sale ({sales})</li>
          <li>
            Dashed line: average cost {formatMoney(row.averageCost, { showCurrency: 'code' })}
          </li>
          <li>
            Solid line:{' '}
            {exit === null
              ? 'no exit level set'
              : `exit level ${formatMoney(exit.level, { showCurrency: 'code' })}`}
          </li>
          {chart.hiddenCount > 0 && (
            <li>{pluralize(chart.hiddenCount, 'entry', 'entries')} before this range not shown</li>
          )}
        </ul>
      </>
    );
  }

  return (
    <Card
      title="Price and entries"
      extra={
        <ToggleGroup
          label="Chart range"
          options={RANGES}
          value={range}
          onChange={setRange}
          formatOption={(option) => RANGE_LABELS[option]}
        />
      }
    >
      {body}
    </Card>
  );
}
