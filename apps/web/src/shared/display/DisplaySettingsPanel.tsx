import { useId } from 'react';
import type { ReactElement } from 'react';

import {
  DENSITIES,
  FONT_PREFERENCES,
  GAIN_LOSS_CONVENTIONS,
  THEME_PREFERENCES,
} from './displaySettings';
import styles from './DisplaySettingsPanel.module.scss';
import { SettingSelect } from './SettingSelect';
import type { DisplaySettingsState } from './useDisplaySettings';

interface DisplaySettingsPanelProps {
  readonly display: DisplaySettingsState;
}

// Display settings panel: allows configuring themes, fonts, density, and gain/loss conventions.
export function DisplaySettingsPanel({ display }: DisplaySettingsPanelProps): ReactElement {
  const { settings, resolvedTheme, update } = display;
  const titleId = useId();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 className={styles.title} id={titleId}>
        Display & Visual Preferences
      </h2>
      <div className={styles.fields}>
        <SettingSelect
          label="Theme (Colors, Borders & Gradients)"
          value={settings.theme}
          options={THEME_PREFERENCES}
          onChange={(theme) => {
            update({ theme });
          }}
        />
        <SettingSelect
          label="Font Family"
          value={settings.font}
          options={FONT_PREFERENCES}
          onChange={(font) => {
            update({ font });
          }}
        />
        <SettingSelect
          label="Density"
          value={settings.density}
          options={DENSITIES}
          onChange={(density) => {
            update({ density });
          }}
        />
        <SettingSelect
          label="Gain / loss colours"
          value={settings.gainLoss}
          options={GAIN_LOSS_CONVENTIONS}
          onChange={(gainLoss) => {
            update({ gainLoss });
          }}
        />
      </div>
      <p className={styles.preview}>
        <span className={styles.gain}>▲ +1.24%</span>
        <span className={styles.loss}>▼ −0.87%</span>
      </p>
      <p className={styles.resolved}>Active theme: {resolvedTheme}</p>
    </section>
  );
}
