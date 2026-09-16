import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { StrategyDraftDto, StrategyVersionDto } from '../../../../data/schemas';
import { formatRelativeTime } from '../../../../shared/format';
import { countConditions } from '../model/ruleTree';
import styles from '../StrategyEditor.module.scss';

export interface VersionHistoryProps {
  readonly draft: StrategyDraftDto;
  readonly versions: readonly StrategyVersionDto[];
  readonly onRevert: (version: StrategyVersionDto) => void;
}

interface Difference {
  readonly label: string;
  readonly from: string;
  readonly to: string;
}

// Comparing whole rule trees line by line would be noise; these are the fields a reader actually
// changes between versions.
function differences(older: StrategyDraftDto, current: StrategyDraftDto): readonly Difference[] {
  const rows: Difference[] = [
    {
      label: 'Entry conditions',
      from: String(countConditions(older.entry)),
      to: String(countConditions(current.entry)),
    },
    {
      label: 'Exit conditions',
      from: String(countConditions(older.exit)),
      to: String(countConditions(current.exit)),
    },
    {
      label: 'Stop loss',
      from:
        older.forcedExit.maxLossPercent === null
          ? 'Not set'
          : `${String(older.forcedExit.maxLossPercent)}%`,
      to:
        current.forcedExit.maxLossPercent === null
          ? 'Not set'
          : `${String(current.forcedExit.maxLossPercent)}%`,
    },
    {
      label: 'Trailing stop',
      from:
        older.forcedExit.trailingStopPercent === null
          ? 'Not set'
          : `${String(older.forcedExit.trailingStopPercent)}%`,
      to:
        current.forcedExit.trailingStopPercent === null
          ? 'Not set'
          : `${String(current.forcedExit.trailingStopPercent)}%`,
    },
    {
      label: 'Size per position',
      from: String(older.sizing.value),
      to: String(current.sizing.value),
    },
    {
      label: 'Max capital',
      from: `${String(older.allocation.maxCapitalPercent)}%`,
      to: `${String(current.allocation.maxCapitalPercent)}%`,
    },
  ];
  return rows.filter((row) => row.from !== row.to);
}

// UI spec 7.8 — version history with the ability to compare and revert.
export function VersionHistory({ draft, versions, onRevert }: VersionHistoryProps): ReactElement {
  const [comparing, setComparing] = useState<string | null>(null);

  return (
    <Card
      title="Version history"
      extra={<span className={styles.meta}>{versions.length} saved</span>}
    >
      {versions.length === 0 ? (
        <p className={styles.note}>No versions saved yet.</p>
      ) : (
        <ul className={styles.versionList}>
          {versions.map((version, index) => {
            const key = `${version.version}-${String(index)}`;
            const diff = differences(version.draft, draft);
            const isComparing = comparing === key;
            return (
              <li key={key} className={styles.versionRow}>
                <span className={styles.issueTitle}>
                  v{version.version}
                  <span className={styles.meta}> · {formatRelativeTime(version.savedAt)}</span>
                </span>
                <p className={styles.meta}>{version.summary}</p>
                <span className={styles.inline}>
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => {
                      setComparing(isComparing ? null : key);
                    }}
                  >
                    {isComparing ? 'Hide comparison' : 'Compare with current'}
                  </button>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      onRevert(version);
                    }}
                  >
                    Revert to this
                  </Button>
                </span>
                {isComparing && (
                  <ul className={styles.diffList}>
                    {diff.length === 0 ? (
                      <li>Identical to the current definition on every compared field.</li>
                    ) : (
                      diff.map((row) => (
                        <li key={row.label}>
                          {row.label}: {row.from} → {row.to}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
