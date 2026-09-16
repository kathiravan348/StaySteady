import { Card, EmptyState, PriceChart } from '@staysteady/ui';
import type { PriceChartMarker } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { usePriceHistories } from '../../../../data/api';
import type { InstrumentDto, StrategyDraftDto } from '../../../../data/schemas';
import { previewSignals, recentWindow, toPreviewBars } from '../model/preview';
import styles from '../StrategyEditor.module.scss';

export interface PreviewPanelProps {
  readonly draft: StrategyDraftDto;
  readonly instruments: readonly InstrumentDto[];
}

const PREVIEW_BARS = 180;

// UI spec 7.8 — where these conditions would have triggered on a recent chart. The first instrument
// in scope stands for the strategy; the point is to see the rules fire, not to measure them.
export function PreviewPanel({ draft, instruments }: PreviewPanelProps): ReactElement {
  const instrumentId = draft.scope.instrumentIds[0];
  const key = instrumentId === undefined ? null : String(instrumentId);
  const histories = usePriceHistories(key === null ? [] : [key]);
  const bars = key === null ? undefined : histories.histories.get(key);
  const symbol =
    instruments.find((instrument) => String(instrument.id) === key)?.symbol ?? key ?? '';

  const preview = useMemo(() => {
    if (bars === undefined) return null;
    // Evaluated over the full history so long indicators have their warm-up, then windowed.
    const full = previewSignals(draft.entry, draft.exit, toPreviewBars(bars));
    return recentWindow(full, PREVIEW_BARS);
  }, [bars, draft.entry, draft.exit]);

  const markers = useMemo<readonly PriceChartMarker[]>(
    () =>
      preview === null
        ? []
        : preview.signals.map((signal) => ({
            time: signal.time,
            position: signal.kind === 'entry' ? ('below' as const) : ('above' as const),
            shape: signal.kind === 'entry' ? ('arrowUp' as const) : ('arrowDown' as const),
            tone: signal.kind === 'entry' ? ('up' as const) : ('down' as const),
            text: signal.kind === 'entry' ? 'Entry' : 'Exit',
          })),
    [preview],
  );

  const chartData = useMemo(
    () =>
      preview === null
        ? []
        : preview.bars.map((bar) => ({
            time: bar.time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          })),
    [preview],
  );

  if (key === null) {
    return (
      <Card title="Preview">
        <EmptyState
          title="Nothing to preview"
          description="Add an instrument to the scope to see where these conditions would have fired."
        />
      </Card>
    );
  }

  return (
    <Card
      title="Preview"
      extra={
        <span className={styles.meta}>
          {preview === null
            ? 'Loading prices'
            : `${String(preview.entryCount)} ${preview.entryCount === 1 ? 'entry' : 'entries'}, ${String(preview.exitCount)} ${preview.exitCount === 1 ? 'exit' : 'exits'}`}
        </span>
      }
    >
      <p className={styles.note}>
        The last {PREVIEW_BARS} trading days of {symbol}, marked where the conditions as written
        would have opened and closed a position. This is not a backtest: no sizing, costs or capital
        are applied.
      </p>
      {preview === null ? (
        <p className={styles.meta}>Loading price history…</p>
      ) : preview.signals.length === 0 ? (
        <p className={styles.meta}>
          These conditions never fired over this period. That may be correct, or the conditions may
          be too strict to ever be true together.
        </p>
      ) : null}
      <PriceChart
        data={chartData}
        markers={markers}
        height={320}
        ariaLabel={`Preview of ${draft.name} on ${symbol}: ${preview === null ? 'no' : String(preview.entryCount)} entry signals over the last ${String(PREVIEW_BARS)} trading days`}
      />
    </Card>
  );
}
