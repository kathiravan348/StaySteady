import { ErrorState, LoadingState, PriceChart } from '@staysteady/ui';
import type { PriceBarData, PriceChartMarker } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Decimal } from 'decimal.js';

import { usePriceHistories } from '../../data/api';
import styles from './PriceReaction.module.scss';

const BARS_BEFORE = 10;
const BARS_AFTER = 5;

// UI spec 7.6 and 20.1 — how the price moved around the time a story was published: daily bars before and
// after, with the publication day marked. The chart is a visual; the text below states the move.
// Shared (decision 25): the news feed and the company research feed both open items against it.
export function PriceReaction({
  instrumentId,
  symbol,
  publishedAt,
}: {
  readonly instrumentId: string;
  readonly symbol: string;
  readonly publishedAt: string;
}): ReactElement {
  const prices = usePriceHistories([instrumentId]);
  const day = publishedAt.slice(0, 10);

  const view = useMemo(() => {
    const bars = prices.histories.get(instrumentId) ?? [];
    const index = bars.findIndex((bar) => bar.timestamp.slice(0, 10) >= day);
    const at = index === -1 ? bars.length - 1 : index;
    const window = bars.slice(Math.max(0, at - BARS_BEFORE), at + BARS_AFTER + 1);
    const data: PriceBarData[] = window.map((bar) => ({
      time: bar.timestamp.slice(0, 10),
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
    }));
    const marked = bars[at];
    const before = bars[at - 1];
    const markers: PriceChartMarker[] =
      marked === undefined
        ? []
        : [
            {
              time: marked.timestamp.slice(0, 10),
              position: 'above',
              shape: 'arrowDown',
              tone: 'neutral',
              text: 'Published',
            },
          ];
    const barsAfter = bars.length - 1 - at;
    const last = window[window.length - 1];
    // Prices are decimal strings; the move is computed exactly and only rounded for display.
    const change =
      before === undefined || last === undefined
        ? null
        : new Decimal(last.close).minus(before.close).dividedBy(before.close).times(100);
    return { data, markers, barsAfter, change };
  }, [prices.histories, instrumentId, day]);

  if (prices.error !== null) {
    return (
      <ErrorState
        title="Price reaction unavailable"
        message={prices.error.message}
        onRetry={prices.refetch}
      />
    );
  }
  if (prices.isPending) return <LoadingState layout="chart" />;
  if (view.data.length < 2) {
    return <p className={styles.meta}>No price history around this date for {symbol}.</p>;
  }

  return (
    <div className={styles.stack}>
      <PriceChart
        data={view.data}
        seriesType="line"
        height={180}
        showVolume={false}
        markers={view.markers}
        ariaLabel={`${symbol} daily closes around ${day}, with the publication day marked`}
      />
      <p className={styles.meta}>
        {view.change === null
          ? `${symbol} around ${day}.`
          : `${symbol} moved ${view.change.isNegative() ? '' : '+'}${view.change.toFixed(2)}% from the close before publication to the latest bar shown.`}
        {view.barsAfter < BARS_AFTER &&
          ' The reaction is still forming: there are few bars since publication.'}
      </p>
    </div>
  );
}
