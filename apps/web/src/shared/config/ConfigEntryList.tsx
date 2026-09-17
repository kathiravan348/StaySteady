import { Badge, Toggle, cx } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ConfigHealthDto, ConfigModeDto } from '../../data/schemas';
import styles from './Config.module.scss';

export interface ConfigListEntry {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly enabled: boolean;
  // Areas with no simulation or live distinction (instrument types, currencies) leave it out.
  readonly mode?: ConfigModeDto;
  readonly health: ConfigHealthDto;
}

export interface ConfigEntryListProps {
  readonly label: string;
  readonly entries: readonly ConfigListEntry[];
  readonly selectedId: string | null;
  readonly isBusy: boolean;
  readonly onSelect: (id: string) => void;
  // Areas whose entries cannot be switched off leave it out, and no toggle is shown.
  readonly onToggleEnabled?: (id: string, enabled: boolean) => void;
}

const HEALTH: Readonly<
  Record<ConfigHealthDto['status'], { variant: BadgeVariant; label: string }>
> = {
  healthy: { variant: 'positive', label: 'Healthy' },
  warning: { variant: 'warning', label: 'Needs attention' },
  critical: { variant: 'critical', label: 'Problem' },
};

// UI spec 7.18 — every configuration area lists its entries with status, an enabled toggle and a
// health indicator, the same way.
export function ConfigEntryList({
  label,
  entries,
  selectedId,
  isBusy,
  onSelect,
  onToggleEnabled,
}: ConfigEntryListProps): ReactElement {
  return (
    <ul className={styles.list} aria-label={label}>
      {entries.map((entry) => {
        const health = HEALTH[entry.health.status];
        return (
          <li
            key={entry.id}
            className={cx(styles.entry, entry.id === selectedId ? styles.entrySelected : undefined)}
          >
            <button
              type="button"
              className={styles.entryButton}
              aria-current={entry.id === selectedId ? 'true' : undefined}
              onClick={() => {
                onSelect(entry.id);
              }}
            >
              <span className={styles.entryTitle}>{entry.title}</span>
              <span className={styles.meta}>{entry.subtitle}</span>
              <span className={styles.inline}>
                <Badge variant={health.variant}>{health.label}</Badge>
                {entry.mode !== undefined && (
                  <Badge variant={entry.mode === 'live' ? 'info' : 'neutral'}>
                    {entry.mode === 'live' ? 'Live' : 'Simulation'}
                  </Badge>
                )}
                {!entry.enabled && <Badge variant="neutral">Disabled</Badge>}
              </span>
            </button>
            {onToggleEnabled !== undefined && (
              <Toggle
                isSelected={entry.enabled}
                isDisabled={isBusy}
                aria-label={`${entry.enabled ? 'Disable' : 'Enable'} ${entry.title}`}
                onChange={(enabled) => {
                  onToggleEnabled(entry.id, enabled);
                }}
              />
            )}
            <span className={styles.health}>{entry.health.summary}</span>
          </li>
        );
      })}
    </ul>
  );
}
