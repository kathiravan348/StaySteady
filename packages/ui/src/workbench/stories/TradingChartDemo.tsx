import { useMemo, useState, type ReactElement } from 'react';

import { TradingChart } from '../../charts/trading/TradingChart';
import type {
  DrawingDraft,
  DrawingTool,
  TradingChartBar,
  TradingDrawing,
  TradingPane,
  TradingSeries,
  TradingSeriesStyle,
} from '../../charts/trading/types';

// Deterministic sample data: a drifting wave with one weekday gap (a holiday) and volume.
function sampleBars(): { bars: TradingChartBar[]; closes: number[]; times: string[] } {
  const bars: TradingChartBar[] = [];
  const closes: number[] = [];
  const times: string[] = [];
  const start = Date.UTC(2025, 0, 1);
  let close = 100;
  for (let day = 0, index = 0; index < 180; day += 1) {
    const date = new Date(start + day * 86_400_000);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const time = date.toISOString().slice(0, 10);
    index += 1;
    if (index === 60) {
      bars.push({ time, isGap: true });
      continue;
    }
    const open = close;
    close = Math.max(20, open + Math.sin(index / 9) * 1.6 + Math.cos(index / 4) * 0.8 + 0.08);
    bars.push({
      time,
      open,
      high: Math.max(open, close) + 1.1,
      low: Math.min(open, close) - 1.1,
      close,
    });
    closes.push(close);
    times.push(time);
  }
  return { bars, closes, times };
}

const STYLES: readonly TradingSeriesStyle[] = ['candlestick', 'hollow', 'bar', 'line', 'area'];
const TOOLS: readonly DrawingTool[] = ['trend', 'horizontal', 'rectangle', 'text'];

export function TradingChartDemo(): ReactElement {
  const [style, setStyle] = useState<TradingSeriesStyle>('candlestick');
  const [tool, setTool] = useState<DrawingTool | null>(null);
  const [drawings, setDrawings] = useState<TradingDrawing[]>([]);
  const data = useMemo(sampleBars, []);

  const overlays = useMemo<TradingSeries[]>(() => {
    const points = data.closes.flatMap((_, index) => {
      if (index < 19) return [];
      const window = data.closes.slice(index - 19, index + 1);
      return [{ time: data.times[index] ?? '', value: window.reduce((a, b) => a + b, 0) / 20 }];
    });
    return [
      { id: 'sma20', label: 'SMA 20', kind: 'line', colorIndex: 0, points, valueFormat: 'price' },
    ];
  }, [data]);

  const panes = useMemo<TradingPane[]>(
    () => [
      {
        id: 'volume',
        label: 'Volume',
        heightRatio: 0.25,
        series: [
          {
            id: 'volume',
            label: 'Volume',
            kind: 'histogram',
            colorIndex: 2,
            valueFormat: 'compact',
            points: data.closes.map((value, index) => ({
              time: data.times[index] ?? '',
              value: 1_000_000 + Math.abs(Math.sin(index)) * 800_000,
              tone: index > 0 && value < (data.closes[index - 1] ?? value) ? 'down' : 'up',
            })),
          },
        ],
      },
    ],
    [data],
  );

  const addDrawing = (draft: DrawingDraft): void => {
    const id = `drawing-${drawings.length + 1}`;
    setDrawings((current) => [
      ...current,
      draft.kind === 'text' ? { id, kind: 'text', at: draft.at, text: 'Note' } : { id, ...draft },
    ]);
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {STYLES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={style === option}
            onClick={() => setStyle(option)}
          >
            {option}
          </button>
        ))}
        {TOOLS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={tool === option}
            onClick={() => setTool((current) => (current === option ? null : option))}
          >
            Draw {option}
          </button>
        ))}
        <button type="button" onClick={() => setDrawings([])}>
          Clear drawings ({drawings.length})
        </button>
      </div>
      <TradingChart
        bars={data.bars}
        style={style}
        mainLabel="SAMPLE"
        overlays={overlays}
        panes={panes}
        drawings={drawings}
        activeTool={tool}
        onDrawingDraft={addDrawing}
        height={300}
        visibleBarCount={120}
        ariaLabel="Sample daily price chart with a 20-day moving average and volume"
      />
    </div>
  );
}
