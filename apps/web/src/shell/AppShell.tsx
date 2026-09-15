// Root Application Shell layout with TopBar, Sidebar, and Scenario Switcher (UI spec 5 & 15).

import type { ReactElement, ChangeEvent } from 'react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useDisplaySettings } from '../shared/display/useDisplaySettings';
import { DisplaySettingsPanel } from '../shared/display/DisplaySettingsPanel';
import { useSystemState } from '../providers/SystemStateProvider';
import type { MockScenario } from '../providers/SystemStateProvider';
import styles from './AppShell.module.scss';

const SCENARIOS: readonly { id: MockScenario; label: string }[] = [
  { id: 'normal', label: 'Normal Markets' },
  { id: 'market-crash', label: 'Market Crash (-12%)' },
  { id: 'high-volatility', label: 'High Volatility' },
  { id: 'connectivity-outage', label: 'Data Outage' },
];

export function AppShell(): ReactElement {
  const display = useDisplaySettings();
  const { mockScenario, setMockScenario } = useSystemState();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const handleScenarioChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setMockScenario(e.target.value as MockScenario);
  };

  return (
    <div className={styles.appContainer}>
      <TopBar onOpenDisplaySettings={() => setShowSettingsModal(true)} />

      <div className={styles.bodyLayout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      <aside className={styles.scenarioFooter} aria-label="Developer scenario switcher">
        <span className={styles.scenarioLabel}>🎮 Scenario:</span>
        <select
          value={mockScenario}
          onChange={handleScenarioChange}
          aria-label="Select mock scenario"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </aside>

      {showSettingsModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Display Settings"
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2>Display Settings</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close display settings"
              >
                ✕
              </button>
            </div>
            <DisplaySettingsPanel display={display} />
          </div>
        </div>
      )}
    </div>
  );
}
