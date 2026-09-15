import { useId } from 'react';
import type { ReactElement } from 'react';

import { DENSITIES, GAIN_LOSS_CONVENTIONS, THEME_PREFERENCES } from './displaySettings';
import styles from './DisplaySettingsPanel.module.scss';
import { SettingSelect } from './SettingSelect';
import type { DisplaySettingsState } from './useDisplaySettings';

interface DisplaySettingsPanelProps {
  readonly display: DisplaySettingsState;
}

// Temporary home for display controls until the top bar and configuration screens exist
// (F-20, F-21, S-18). Gain and loss are always paired with an arrow and sign (UI spec 4).
export function DisplaySettingsPanel({ display }: DisplaySettingsPanelProps): ReactElement {
  const { settings, resolvedTheme, update } = display;
  const titleId = useId();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 className={styles.title} id={titleId}>
        Display
      </h2>
      <div className={styles.fields}>
        <SettingSelect
          label="Theme"
          value={settings.theme}
          options={THEME_PREFERENCES}
          onChange={(theme) => {
            update({ theme });
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
