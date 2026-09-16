import { Badge, Button, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAlertAction } from '../../../data/api';
import type { AlertGroupDto } from '../../../data/schemas';
import { formatDateTime, formatRelativeTime } from '../../../shared/format';
import { CATEGORY_LABELS, SEVERITY, STATE } from '../model/alertFilters';
import styles from '../Alerts.module.scss';

// formatRelativeTime describes the past; an escalation still to come needs its own wording.
function minutesUntil(iso: string): string {
  const minutes = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000));
  return minutes <= 1 ? 'within a minute' : `in ${String(minutes)} minutes`;
}

const EDGE: Readonly<Record<AlertGroupDto['severity'], string | undefined>> = {
  low: undefined,
  medium: styles.medium,
  high: styles.high,
  critical: styles.critical,
};

// UI spec 7.19 — one alert, or a group of repeats of it: severity in word and symbol as well as
// colour, escalation for an unacknowledged critical alert, and acknowledge or resolve with a note.
export function AlertItem({
  alert,
  marketName,
}: {
  readonly alert: AlertGroupDto;
  readonly marketName: string | null;
}): ReactElement {
  const action = useAlertAction();
  const [isOpen, setIsOpen] = useState(alert.escalation !== null);
  const [note, setNote] = useState('');
  const severity = SEVERITY[alert.severity];
  const latest = alert.occurrences[0];
  const repeats = alert.occurrences.length;
  const detailsId = `alert-${alert.id}`;
  const act = (kind: 'acknowledge' | 'resolve'): void => {
    action.mutate(
      { id: alert.id, action: kind, note: note.trim() === '' ? null : note.trim() },
      {
        onSuccess: () => {
          setNote('');
        },
      },
    );
  };

  return (
    <li
      className={cx(
        styles.alert,
        EDGE[alert.severity],
        alert.state === 'resolved' ? styles.resolved : undefined,
      )}
    >
      <span className={styles.inline}>
        <Badge variant={severity.variant}>
          {severity.symbol} {severity.label}
        </Badge>
        <Badge variant={STATE[alert.state].variant}>{STATE[alert.state].label}</Badge>
        <span className={styles.meta}>
          {CATEGORY_LABELS[alert.category]} · {alert.source}
          {marketName === null ? '' : ` · ${marketName}`}
        </span>
        {latest !== undefined && (
          <time className={styles.meta} dateTime={latest} title={formatDateTime(latest)}>
            {formatRelativeTime(latest)}
          </time>
        )}
        {repeats > 1 && <Badge variant="neutral">×{repeats} occurrences</Badge>}
      </span>

      <h3 className={styles.title}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {alert.title}
        </button>
      </h3>

      {alert.escalation !== null && (
        <div className={styles.escalation} role="status">
          <strong className={styles.note}>
            {alert.escalation.hasEscalated
              ? `Escalated to ${alert.escalation.escalatesTo.join(', ')} at ${formatDateTime(alert.escalation.escalatesAt)}`
              : `Escalates to ${alert.escalation.escalatesTo.join(', ')} at ${formatDateTime(alert.escalation.escalatesAt)} (${minutesUntil(alert.escalation.escalatesAt)}) unless acknowledged`}
          </strong>
          <span className={styles.meta}>
            Sent to {alert.escalation.sentTo.join(', ')} under “{alert.escalation.ruleName}”.
            {alert.escalation.failedChannels.length > 0 &&
              ` Delivery to ${alert.escalation.failedChannels.join(', ')} failed; its last test failed too.`}
          </span>
        </div>
      )}

      {isOpen && (
        <div id={detailsId} className={styles.details}>
          <p className={styles.note}>{alert.message}</p>
          {alert.link !== null && (
            <Link className={styles.meta} to={alert.link.to}>
              {alert.link.label}
            </Link>
          )}
          {repeats > 1 && (
            <div className={styles.stack}>
              <span className={styles.fieldLabel}>Occurrences, newest first</span>
              <ul className={styles.plain}>
                {alert.occurrences.map((at) => (
                  <li key={at} className={styles.meta}>
                    {formatDateTime(at)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alert.notes.length > 0 && (
            <div className={styles.stack}>
              <span className={styles.fieldLabel}>History</span>
              <ul className={styles.plain}>
                {alert.notes.map((item) => (
                  <li key={`${item.at}-${item.action}`} className={styles.meta}>
                    {item.action === 'acknowledged' ? 'Acknowledged' : 'Resolved'}{' '}
                    {formatDateTime(item.at)}
                    {item.note === null ? '' : `: ${item.note}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alert.state !== 'resolved' && (
            <div className={styles.stack}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Note (optional)</span>
                <input
                  className={styles.input}
                  value={note}
                  maxLength={500}
                  onChange={(event) => {
                    setNote(event.target.value);
                  }}
                />
              </label>
              <span className={styles.inline}>
                {alert.state === 'open' && (
                  <Button
                    isLoading={action.isPending}
                    onPress={() => {
                      act('acknowledge');
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
                <Button
                  variant="secondary"
                  isLoading={action.isPending}
                  onPress={() => {
                    act('resolve');
                  }}
                >
                  Resolve
                </Button>
              </span>
              {action.isError && <p className={styles.warning}>{action.error.message}</p>}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
