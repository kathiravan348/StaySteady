import { useMemo, useRef, type KeyboardEvent, type ReactElement } from 'react';

import { cx } from '../../utils/cx';
import { paletteColor } from '../shared/chartColors';
import { useChartTheme } from '../theme/useChartTheme';
import { latestLegend } from './legendValues';
import styles from './TradingChart.module.scss';
import { TradingChartControls } from './TradingChartControls';
import type { DrawingTool, TradingChartProps, TradingPane } from './types';
import { useTradingChart } from './useTradingChart';

const NO_PANES: readonly TradingPane[] = [];
const DEFAULT_PANE_RATIO = 0.3;

const TOOL_HINTS: Readonly<Record<DrawingTool, readonly [string, string]>> = {
  trend: ['Click the start of the trend line.', 'Click the end of the trend line.'],
  rectangle: ['Click one corner of the rectangle.', 'Click the opposite corner.'],
  horizontal: ['Click a price to add a horizontal level.', ''],
  text: ['Click where the note should go.', ''],
};

const defaultFormatPrice = (value: number): string => value.toFixed(2);
const defaultFormatTime = (time: unknown): string =>
  typeof time === 'number'
    ? new Date(time * 1000).toISOString().slice(0, 16).replace('T', ' ')
    : String(time);

// UI spec 7.4 and 8.3 — stacked price and indicator panes sharing one time axis and crosshair.
export function TradingChart(props: TradingChartProps): ReactElement {
  const {
    height = 420,
    panes = NO_PANES,
    mainLabel,
    ariaLabel,
    className,
    activeTool = null,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useChartTheme();
  const subPaneHeights = useMemo(
    () => panes.map((pane) => Math.round(height * (pane.heightRatio ?? DEFAULT_PANE_RATIO))),
    [panes, height],
  );
  const { hover, pendingAnchor, api } = useTradingChart(
    containerRef,
    props,
    colors,
    subPaneHeights,
  );
  const formatPrice = props.formatPrice ?? defaultFormatPrice;
  const formatTime = props.formatTime ?? defaultFormatTime;
  const legend = hover ?? latestLegend(props, formatPrice);
  const totalHeight = height + subPaneHeights.reduce((sum, value) => sum + value, 0);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => api.pan(-10),
      ArrowRight: () => api.pan(10),
      '+': () => api.zoom(0.7),
      '=': () => api.zoom(0.7),
      '-': () => api.zoom(1.4),
      '0': api.resetView,
      Home: api.resetView,
    };
    const action = actions[event.key];
    if (action !== undefined) {
      event.preventDefault();
      action();
    }
  };

  const hint = activeTool === null ? '' : TOOL_HINTS[activeTool][pendingAnchor === null ? 0 : 1];

  return (
    <div className={cx(styles.root, className)}>
      <TradingChartControls api={api} fileName={mainLabel.replace(/[^\w-]+/g, '-').toLowerCase()} />
      <div className={styles.frame}>
        <div className={styles.legend}>
          <strong>{mainLabel}</strong>
          {legend.time !== null && (
            <span className={styles.legendTime}>{formatTime(legend.time)}</span>
          )}
          {legend.values.map((item) => (
            <span key={item.label} className={styles.legendItem}>
              <span
                className={styles.legendLabel}
                style={
                  item.colorIndex === undefined
                    ? undefined
                    : { color: paletteColor(item.colorIndex, colors) }
                }
              >
                {item.label}
              </span>{' '}
              {item.value}
            </span>
          ))}
        </div>
        {/* The canvas chart is a keyboard-operable widget (role="application"); jsx-a11y does not
            count that role as interactive, so its keyboard handler and tab stop are allowed here. */}
        {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={containerRef}
          className={cx(styles.canvas, activeTool !== null && styles.drawing)}
          style={{ height: totalHeight }}
          role="application"
          aria-roledescription="interactive chart"
          aria-label={`${ariaLabel}. Arrow keys scroll, plus and minus zoom, 0 resets the view.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
        />
        {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      </div>
      <p className={styles.hint} aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
