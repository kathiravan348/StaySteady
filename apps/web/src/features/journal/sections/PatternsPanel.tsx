import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { JournalEntryDto, JournalPatternDto } from '../../../data/schemas';
import styles from '../Journal.module.scss';

const KIND_LABELS: Readonly<Record<JournalPatternDto['kind'], string>> = {
  override_repetition: 'Repeated override',
  post_loss_clustering: 'After a loss',
  target_drift: 'Away from targets',
};

// Patterns in the owner's own decisions (requirements 29), stated as facts rather than advice.
export function PatternsPanel({
  patterns,
  entries,
}: {
  readonly patterns: readonly JournalPatternDto[];
  readonly entries: readonly JournalEntryDto[];
}): ReactElement {
  return (
    <Card title="Patterns in your decisions">
      {patterns.length === 0 ? (
        <p className={styles.note}>
          No repeated overrides, clustering after losses or drift from targets in the last 180 days.
        </p>
      ) : (
        <ul className={styles.patterns}>
          {patterns.map((pattern) => (
            <li key={pattern.id} className={styles.stack}>
              <span className={styles.inline}>
                <Badge variant="warning">{KIND_LABELS[pattern.kind]}</Badge>
                <span className={styles.title}>{pattern.title}</span>
              </span>
              <p className={styles.note}>{pattern.detail}</p>
              <p className={styles.meta}>
                {pattern.entryIds
                  .map((id) => entries.find((entry) => entry.id === id))
                  .filter((entry): entry is JournalEntryDto => entry !== undefined)
                  .map((entry) => `${entry.at.slice(0, 10)} ${entry.title}`)
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
