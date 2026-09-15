// Persistent Top Bar (UI spec 5).

import type { ReactElement, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSystemState } from '../providers/SystemStateProvider';
import type { SystemMode } from '../providers/SystemStateProvider';
import { useMarketSchedule } from '../providers/MarketScheduleProvider';
import { BASE_CURRENCIES } from '../shared/types/currency';
import type { BaseCurrencyCode } from '../shared/types/currency';
import styles from './TopBar.module.scss';

export interface TopBarProps {
  readonly onOpenDisplaySettings?: () => void;
  readonly onOpenSearch?: () => void;
}

const MODES: readonly SystemMode[] = [
  'simulation',
  'observation',
  'manual-approval',
  'full-automation',
];

export function TopBar({ onOpenDisplaySettings, onOpenSearch }: TopBarProps): ReactElement {
  const {
    mode,
    setMode,
    isAutomationStopped,
    toggleAutomationStop,
    baseCurrency,
    setBaseCurrency,
    healthStatus,
    unreadAlertsCount,
  } = useSystemState();

  const { marketStatuses } = useMarketSchedule();

  const cycleMode = (): void => {
    const currentIndex = MODES.indexOf(mode);
    const nextMode = MODES[(currentIndex + 1) % MODES.length];
    if (nextMode) {
      setMode(nextMode);
    }
  };

  const handleCurrencyChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setBaseCurrency(e.target.value as BaseCurrencyCode);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <Link to="/overview" className={styles.brand}>
          <span className={styles.brandMark}>S</span>
          <span className={styles.brandText}>StaySteady</span>
        </Link>
        <span className={styles.mockBadge} title="Running against mock data layer">
          🧪 Mock Mode
        </span>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.marketStrip} aria-label="Global market status">
          {marketStatuses.map((market) => (
            <div
              key={market.marketId}
              className={styles.marketPill}
              title={`${market.name} (${market.exchangeName}): ${market.state} at ${market.localTimeFormatted}`}
            >
              <span className={`${styles.marketDot} ${styles[market.state]}`} />
              <span>{market.marketId}</span>
              <span>{market.localTimeFormatted.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rightSection}>
        <button
          type="button"
          className={`${styles.modeBadge} ${styles[mode]}`}
          onClick={cycleMode}
          title="Click to cycle system automation mode"
        >
          ● {mode.replace('-', ' ')}
        </button>

        <button
          type="button"
          className={`${styles.killSwitch} ${isAutomationStopped ? styles.stopped : ''}`}
          onClick={toggleAutomationStop}
          title="Master automation stop / kill switch"
        >
          {isAutomationStopped ? '▶ Resume Auto' : '⏹ Stop Auto'}
        </button>

        <select
          className={styles.currencySelect}
          value={baseCurrency}
          onChange={handleCurrencyChange}
          title="Base currency for portfolio valuation"
          aria-label="Base currency"
        >
          {BASE_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <span className={styles.healthIndicator} title={`System Health: ${healthStatus}`}>
          <span
            className={`${styles.healthDot} ${styles[healthStatus]}`}
            aria-label={`System health: ${healthStatus}`}
          />
        </span>

        {onOpenSearch && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onOpenSearch}
            title="Global search (⌘K)"
            aria-label="Global search"
          >
            🔍
          </button>
        )}

        <Link
          to="/alerts"
          className={styles.iconButton}
          title="Alerts and notifications"
          aria-label="Alerts and notifications"
        >
          🔔
          {unreadAlertsCount > 0 && <span className={styles.badgeCount}>{unreadAlertsCount}</span>}
        </Link>

        {onOpenDisplaySettings && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onOpenDisplaySettings}
            title="Theme & Display Settings"
            aria-label="Display settings"
          >
            ⚙️
          </button>
        )}
      </div>
    </header>
  );
}
