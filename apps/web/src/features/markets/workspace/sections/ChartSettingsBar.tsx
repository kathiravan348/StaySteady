import type { ReactElement } from 'react';

import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import type { ChartStyle, WorkspaceLayout } from '../model/workspaceLayout';
import {
  CHART_STYLES,
  isIntraday,
  PRICE_SCALES,
  RANGES,
  TIMEFRAME_LABELS,
  TIMEFRAMES,
} from '../model/workspaceLayout';
import styles from '../WorkspacePage.module.scss';

export interface ChartSettingsBarProps {
  readonly layout: WorkspaceLayout;
  readonly isComparing: boolean;
  readonly onChange: (change: Partial<WorkspaceLayout>) => void;
}

const STYLE_LABELS: Readonly<Record<ChartStyle, string>> = {
  candlestick: 'Candles',
  hollow: 'Hollow candles',
  bar: 'OHLC bars',
  line: 'Line',
  area: 'Area',
};

const SCALE_LABELS: Readonly<Record<WorkspaceLayout['priceScale'], string>> = {
  linear: 'Linear',
  log: 'Log',
  percent: 'Percent',
};

// UI spec 7.4 — series style, timeframe, range presets and price scale.
export function ChartSettingsBar({
  layout,
  isComparing,
  onChange,
}: ChartSettingsBarProps): ReactElement {
  return (
    <div className={styles.toolbarRow}>
      <ToggleGroup
        label="Timeframe"
        options={TIMEFRAMES}
        value={layout.timeframe}
        onChange={(timeframe) => {
          onChange({ timeframe });
        }}
        formatOption={(option) => TIMEFRAME_LABELS[option]}
      />
      {!isIntraday(layout.timeframe) && (
        <ToggleGroup
          label="Range"
          options={RANGES}
          value={layout.range}
          onChange={(range) => {
            onChange({ range });
          }}
        />
      )}
      <label className={styles.inlineField}>
        <span className={styles.fieldLabel}>Style</span>
        <select
          className={styles.select}
          value={layout.style}
          onChange={(event) => {
            const style = CHART_STYLES.find((option) => option === event.target.value);
            if (style !== undefined) onChange({ style });
          }}
        >
          {CHART_STYLES.map((option) => (
            <option key={option} value={option}>
              {STYLE_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      {isComparing ? (
        <span className={styles.note}>Percent scale while comparing</span>
      ) : (
        <ToggleGroup
          label="Price scale"
          options={PRICE_SCALES}
          value={layout.priceScale}
          onChange={(priceScale) => {
            onChange({ priceScale });
          }}
          formatOption={(option) => SCALE_LABELS[option]}
        />
      )}
    </div>
  );
}
