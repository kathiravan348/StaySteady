import type { DrawingTool } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { InstrumentDto } from '../../../../data/schemas';
import type { LayoutSource } from '../useWorkspaceLayout';
import type { WorkspaceLayout } from '../model/workspaceLayout';
import { INDICATOR_LABELS, INDICATORS, isIntraday } from '../model/workspaceLayout';
import styles from '../WorkspacePage.module.scss';

export interface ChartToolsBarProps {
  readonly layout: WorkspaceLayout;
  readonly instruments: readonly InstrumentDto[];
  readonly currentId: string;
  readonly onChange: (change: Partial<WorkspaceLayout>) => void;
  readonly activeTool: DrawingTool | null;
  readonly onToolChange: (tool: DrawingTool | null) => void;
  readonly drawingCount: number;
  readonly onClearDrawings: () => void;
  readonly onCopyData: () => void;
  readonly onSaveTypeDefault: () => void;
  readonly onReset: () => void;
  readonly typeLabel: string;
  readonly layoutSource: LayoutSource;
  readonly status: string;
}

const TOOLS: readonly DrawingTool[] = ['trend', 'horizontal', 'rectangle', 'text'];
const TOOL_LABELS: Readonly<Record<DrawingTool, string>> = {
  trend: 'Trend line',
  horizontal: 'Level',
  rectangle: 'Rectangle',
  text: 'Note',
};
const SOURCE_TEXT: Readonly<Record<LayoutSource, string>> = {
  instrument: 'Layout saved for this instrument',
  type: 'Using your default for this type',
  'built-in': 'Using the built-in layout',
};

// UI spec 7.4 — indicators, benchmark comparison, event markers, drawing tools and layouts.
export function ChartToolsBar(props: ChartToolsBarProps): ReactElement {
  const { layout, onChange, activeTool, onToolChange } = props;
  const intraday = isIntraday(layout.timeframe);

  return (
    <div className={styles.toolbarRow}>
      <details className={styles.disclosure}>
        <summary className={styles.toolButton}>Indicators ({layout.indicators.length})</summary>
        <fieldset className={styles.popover}>
          <legend className={styles.visuallyHidden}>Indicators</legend>
          {INDICATORS.map((id) => (
            <label key={id} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={layout.indicators.includes(id)}
                onChange={(event) => {
                  onChange({
                    indicators: event.target.checked
                      ? [...layout.indicators, id]
                      : layout.indicators.filter((item) => item !== id),
                  });
                }}
              />
              {INDICATOR_LABELS[id]}
            </label>
          ))}
        </fieldset>
      </details>
      <label className={styles.inlineField}>
        <span className={styles.fieldLabel}>Compare</span>
        <select
          className={styles.select}
          value={intraday ? '' : (layout.compareInstrumentId ?? '')}
          disabled={intraday}
          title={intraday ? 'Comparison uses daily history' : undefined}
          onChange={(event) => {
            onChange({
              compareInstrumentId: event.target.value === '' ? null : event.target.value,
            });
          }}
        >
          <option value="">None</option>
          {props.instruments
            .filter((instrument) => instrument.id !== props.currentId)
            .map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.symbol} · {instrument.name}
              </option>
            ))}
        </select>
      </label>
      <label className={styles.checkOption}>
        <input
          type="checkbox"
          checked={layout.showEvents}
          onChange={(event) => {
            onChange({ showEvents: event.target.checked });
          }}
        />
        Event markers
      </label>
      <div className={styles.buttonGroup} role="group" aria-label="Drawing tools">
        {TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            className={styles.toolButton}
            aria-pressed={activeTool === tool}
            onClick={() => {
              onToolChange(activeTool === tool ? null : tool);
            }}
          >
            {TOOL_LABELS[tool]}
          </button>
        ))}
        <button
          type="button"
          className={styles.toolButton}
          disabled={props.drawingCount === 0}
          onClick={props.onClearDrawings}
        >
          Clear drawings ({props.drawingCount})
        </button>
      </div>
      <div className={styles.buttonGroup}>
        <button type="button" className={styles.toolButton} onClick={props.onCopyData}>
          Copy data
        </button>
        <button type="button" className={styles.toolButton} onClick={props.onSaveTypeDefault}>
          Save as default for {props.typeLabel}
        </button>
        <button type="button" className={styles.toolButton} onClick={props.onReset}>
          Reset layout
        </button>
        <span className={styles.note} aria-live="polite">
          {props.status === '' ? SOURCE_TEXT[props.layoutSource] : props.status}
        </span>
      </div>
    </div>
  );
}
