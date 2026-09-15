import type { ReactElement } from 'react';

import styles from './App.module.scss';
import { DisplaySettingsPanel } from './shared/display/DisplaySettingsPanel';
import { useDisplaySettings } from './shared/display/useDisplaySettings';

// Placeholder shell. Application shell, routing and providers are task F-20.
export function App(): ReactElement {
  const display = useDisplaySettings();

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>StaySteady</h1>
      <DisplaySettingsPanel display={display} />
    </main>
  );
}
