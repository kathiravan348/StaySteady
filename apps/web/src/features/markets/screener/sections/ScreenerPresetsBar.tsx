// Strategy preset selector bar for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { FC } from 'react';
import { Card } from '@staysteady/ui';

import type { ScreenerPreset } from '../../../../data/schemas/screener';
import styles from '../Screener.module.scss';

export interface ScreenerPresetsBarProps {
  readonly presets: readonly ScreenerPreset[];
  readonly activePresetId: string | null;
  readonly onSelectPreset: (preset: ScreenerPreset) => void;
}

export const ScreenerPresetsBar: FC<ScreenerPresetsBarProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
}) => {
  return (
    <Card title="Quantitative Strategy Presets">
      <div className={styles.stack}>
        <p className={styles.presetDesc}>
          Select a factor model template to instantly configure filters, or adjust criteria below to
          build a bespoke screener query.
        </p>

        <div className={styles.gridFilters}>
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`${styles.presetCard} ${isActive ? styles.presetActive : ''}`}
                onClick={() => onSelectPreset(preset)}
              >
                <div className={styles.inline}>
                  <span aria-hidden="true">{preset.icon}</span>
                  <span className={styles.presetTitle}>{preset.name}</span>
                </div>
                <p className={styles.presetDesc}>{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
