import { Badge, Card, KeyValuePair, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useStrategies } from '../../../../data/api';
import { strategyEditorPath } from '../../../../routes/routes';
import { formatDateTime, humanizeToken } from '../../../../shared/format';
import { toIsoUtcTimestamp } from '../../../../shared/types/dateTime';
import type { HoldingRow } from '../../holdings/model/holdingTypes';
import type { PositionNote } from '../model/positionEdits';
import styles from '../PositionPage.module.scss';

export interface StrategyNotesPanelProps {
  readonly row: HoldingRow;
  readonly notes: readonly PositionNote[];
  readonly onRemoveNote: (id: string) => void;
}

function StrategyBody({ row }: { readonly row: HoldingRow }): ReactElement {
  const strategies = useStrategies();
  if (row.strategyId === null) {
    return (
      <p className={styles.note}>
        Opened manually. No strategy manages this position, so exits are yours to set.
      </p>
    );
  }
  if (strategies.isPending) {
    return <LoadingState layout="table" count={2} />;
  }
  const strategy = strategies.data?.find((item) => item.id === row.strategyId);
  if (strategy === undefined) {
    return (
      <p className={styles.note}>
        Opened by strategy {row.strategyId}. Strategy details are unavailable right now.
      </p>
    );
  }
  return (
    <div className={styles.panelStack}>
      <div className={styles.badges}>
        <strong>{strategy.name}</strong>
        <Badge variant="info">{humanizeToken(strategy.stage)}</Badge>
        <Badge variant="neutral">Version {strategy.version}</Badge>
      </div>
      <p className={styles.wrapText}>{strategy.description}</p>
      <div className={styles.keyValues}>
        <KeyValuePair label="Timeframe" value={strategy.timeframe} />
        {Object.entries(strategy.parameters).map(([key, value]) => (
          <KeyValuePair key={key} label={humanizeToken(key)} value={String(value)} isMono />
        ))}
      </div>
      <Link to={strategyEditorPath(strategy.id)} className={styles.link}>
        Open in strategy editor
      </Link>
    </div>
  );
}

// UI spec 7.3 — which strategy holds it and why it was opened, plus the owner's notes.
export function StrategyNotesPanel({
  row,
  notes,
  onRemoveNote,
}: StrategyNotesPanelProps): ReactElement {
  return (
    <div className={styles.panelGrid}>
      <Card title="Why it is held">
        <StrategyBody row={row} />
      </Card>
      <Card title="Notes">
        {notes.length === 0 ? (
          <p className={styles.note}>
            No notes yet. Use &quot;Add note&quot; to record your thinking.
          </p>
        ) : (
          <ul className={styles.list}>
            {notes.map((note) => (
              <li key={note.id} className={styles.stackedRow}>
                <span className={styles.wrapText}>{note.text}</span>
                <span className={styles.meta}>
                  {formatDateTime(toIsoUtcTimestamp(note.createdAt), { includeSeconds: false })} ·
                  this session only{' '}
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      onRemoveNote(note.id);
                    }}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
