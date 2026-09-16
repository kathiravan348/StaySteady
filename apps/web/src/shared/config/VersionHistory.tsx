import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { IsoUtcTimestamp } from '../types/dateTime';
import { formatDateTime } from '../format';
import { diffDescriptions } from './configFields';
import styles from './Config.module.scss';

export interface HistoryVersion {
  readonly version: number;
  readonly savedAt: IsoUtcTimestamp;
  readonly reason: string;
  // The version in the area's own words, so the diff needs no knowledge of the data shape.
  readonly description: Readonly<Record<string, string>>;
}

export interface VersionHistoryProps {
  readonly versions: readonly HistoryVersion[];
  readonly isBusy: boolean;
  readonly error: string | null;
  readonly onRevert: (version: number, reason: string) => void;
}

// UI spec 7.18 — version history with diff and revert. The newest version is in force; any older one
// can be compared against it and brought back, which saves it again as a new version.
export function VersionHistory({
  versions,
  isBusy,
  error,
  onRevert,
}: VersionHistoryProps): ReactElement {
  const [comparing, setComparing] = useState<number | null>(null);
  const [reverting, setReverting] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const current = versions[0];

  return (
    <Card
      title="Version history"
      extra={<span className={styles.meta}>{versions.length} saved</span>}
    >
      <ul className={styles.list}>
        {versions.map((item) => {
          const isCurrent = item.version === current?.version;
          const rows =
            current === undefined || isCurrent
              ? []
              : diffDescriptions(item.description, current.description);
          return (
            <li key={item.version} className={styles.version}>
              <span className={styles.inline}>
                <strong className={styles.note}>Version {item.version}</strong>
                {isCurrent && <span className={styles.meta}>In force</span>}
                <span className={styles.meta}>{formatDateTime(item.savedAt)}</span>
              </span>
              <p className={styles.note}>{item.reason}</p>

              {!isCurrent && (
                <span className={styles.inline}>
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => {
                      setComparing(comparing === item.version ? null : item.version);
                    }}
                  >
                    {comparing === item.version ? 'Hide differences' : 'Compare with current'}
                  </button>
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => {
                      setReverting(item.version);
                      setReason('');
                    }}
                  >
                    Revert to this version
                  </button>
                </span>
              )}

              {comparing === item.version && (
                <div className={styles.diffTableScroll}>
                  {rows.length === 0 ? (
                    <p className={styles.meta}>Identical to the version in force.</p>
                  ) : (
                    <table className={styles.diffTable}>
                      <thead>
                        <tr>
                          <th scope="col">Setting</th>
                          <th scope="col">Version {item.version}</th>
                          <th scope="col">In force</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.key}>
                            <th scope="row">{row.key}</th>
                            <td className={styles.removed}>{row.before ?? 'Not set'}</td>
                            <td className={styles.added}>{row.after ?? 'Not set'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {reverting === item.version && (
                <div className={styles.stack}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Why revert to version {item.version}? It is saved as a new version.
                    </span>
                    <input
                      className={styles.input}
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                      }}
                    />
                  </label>
                  <span className={styles.inline}>
                    <Button
                      variant="secondary"
                      onPress={() => {
                        setReverting(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      isDisabled={reason.trim() === ''}
                      isLoading={isBusy}
                      onPress={() => {
                        onRevert(item.version, reason.trim());
                        setReverting(null);
                      }}
                    >
                      Revert
                    </Button>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error !== null && <p className={styles.fieldError}>{error}</p>}
    </Card>
  );
}
