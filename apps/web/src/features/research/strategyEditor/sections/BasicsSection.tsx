// Name, purpose and bar size (T-02). Checked with the same schema the save endpoint uses.

import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { StrategyNameSchema, StrategyTimeframeSchema } from '../../../../data/schemas';
import type { StrategyTimeframeDto } from '../../../../data/schemas';
import type { SettingsProps } from './SettingsSections';
import styles from '../StrategyEditor.module.scss';

const TIMEFRAME_LABELS: Readonly<Record<StrategyTimeframeDto, string>> = {
  '1h': 'Hourly bars',
  '4h': 'Four-hour bars',
  '1d': 'Daily bars',
  '1w': 'Weekly bars',
};

const isTimeframe = (value: string): value is StrategyTimeframeDto =>
  StrategyTimeframeSchema.safeParse(value).success;

export function BasicsSection({ draft, onChange }: SettingsProps): ReactElement {
  const nameCheck = StrategyNameSchema.safeParse(draft.name);
  const nameError = nameCheck.success ? null : (nameCheck.error.issues[0]?.message ?? null);
  const isIntraday = draft.timeframe === '1h' || draft.timeframe === '4h';
  const barLabel = isTimeframe(draft.timeframe)
    ? TIMEFRAME_LABELS[draft.timeframe].toLowerCase()
    : draft.timeframe;

  return (
    <Card title="Basics">
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <input
            className={styles.input}
            value={draft.name}
            aria-invalid={nameError !== null}
            onChange={(event) => {
              const name = event.target.value;
              onChange((current) => ({ ...current, name }));
            }}
          />
          {nameError !== null && <span className={styles.saveError}>{nameError}</span>}
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Bar size</span>
          <select
            className={styles.input}
            value={draft.timeframe}
            onChange={(event) => {
              const timeframe = event.target.value;
              if (isTimeframe(timeframe)) onChange((current) => ({ ...current, timeframe }));
            }}
          >
            {StrategyTimeframeSchema.options.map((option) => (
              <option key={option} value={option}>
                {TIMEFRAME_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>What is it for?</span>
        <input
          className={styles.input}
          value={draft.description}
          onChange={(event) => {
            const description = event.target.value;
            onChange((current) => ({ ...current, description }));
          }}
        />
      </label>
      {isIntraday && (
        <p className={styles.note}>
          The preview and backtests use daily history in the mock phase, so they read these rules on
          daily bars. Live signals would use {barLabel}.
        </p>
      )}
    </Card>
  );
}
