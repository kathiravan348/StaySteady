import { Badge, Button, Card, ErrorState, LoadingState, Toggle } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import {
  useAlertChannels,
  useReportRuns,
  useReportSchedules,
  useScheduleAction,
} from '../../../data/api';
import type { ReportCurrencyDto, ReportFrequencyDto, ReportTypeDto } from '../../../data/schemas';
import { ReportFrequencySchema } from '../../../data/schemas';
import { formatDateTime, humanizeToken } from '../../../shared/format';
import { BASE_CURRENCIES } from '../../../shared/types/currency';
import { REPORT_TYPES } from '../model/reportModel';
import styles from '../Reports.module.scss';

const typeLabel = (type: ReportTypeDto): string =>
  REPORT_TYPES.find((item) => item.value === type)?.label ?? type;

// UI spec 7.16 — scheduled report configuration and history. Delivery uses the alert channels, so a
// failing channel shows up here as a failed run.
export function ScheduledReports(): ReactElement {
  const schedules = useReportSchedules();
  const runs = useReportRuns();
  const channels = useAlertChannels();
  const action = useScheduleAction();
  const [type, setType] = useState<ReportTypeDto>('performance');
  const [frequency, setFrequency] = useState<ReportFrequencyDto>('monthly');
  const [currency, setCurrency] = useState<ReportCurrencyDto>('USD');
  const [channelId, setChannelId] = useState('ch-email');

  const channelName = (id: string): string =>
    channels.data?.find((item) => item.id === id)?.name ?? id;
  const failed = [schedules, runs, channels].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Scheduled reports unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void schedules.refetch();
          void runs.refetch();
          void channels.refetch();
        }}
      />
    );
  }
  if (schedules.data === undefined || runs.data === undefined || channels.data === undefined) {
    return <LoadingState layout="table" count={3} />;
  }

  return (
    <div className={styles.page}>
      <Card
        title="Scheduled reports"
        extra={<span className={styles.meta}>{schedules.data.length} schedules</span>}
      >
        <div className={styles.stack}>
          {schedules.data.length === 0 ? (
            <p className={styles.note}>No reports are scheduled. Add one below.</p>
          ) : (
            <ul className={styles.list}>
              {schedules.data.map((schedule) => {
                const lastRun = runs.data.find((run) => run.scheduleId === schedule.id);
                return (
                  <li key={schedule.id} className={styles.schedule}>
                    <span className={styles.stack}>
                      <strong className={styles.note}>
                        {typeLabel(schedule.type)} · {humanizeToken(schedule.frequency)} ·{' '}
                        {schedule.currency}
                      </strong>
                      <span className={styles.meta}>
                        To {channelName(schedule.channelId)} ·{' '}
                        {schedule.enabled ? `next ${formatDateTime(schedule.nextRunAt)}` : 'paused'}
                      </span>
                      {lastRun !== undefined && (
                        <span className={styles.inline}>
                          <Badge variant={lastRun.status === 'delivered' ? 'positive' : 'critical'}>
                            Last run {lastRun.status}
                          </Badge>
                          <span className={styles.meta}>{lastRun.detail}</span>
                        </span>
                      )}
                    </span>
                    <span className={styles.inline}>
                      <Toggle
                        isSelected={schedule.enabled}
                        isDisabled={action.isPending}
                        aria-label={`${schedule.enabled ? 'Pause' : 'Resume'} ${typeLabel(schedule.type)} schedule`}
                        onChange={(enabled) => {
                          action.mutate({ kind: 'toggle', id: schedule.id, enabled });
                        }}
                      />
                      <Button
                        variant="secondary"
                        isDisabled={action.isPending}
                        onPress={() => {
                          action.mutate({ kind: 'run', id: schedule.id });
                        }}
                      >
                        Run now
                      </Button>
                      <Button
                        variant="danger"
                        isDisabled={action.isPending}
                        onPress={() => {
                          action.mutate({ kind: 'delete', id: schedule.id });
                        }}
                      >
                        Delete
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {action.isError && <p className={styles.warning}>{action.error.message}</p>}

          <div className={styles.controls} role="group" aria-label="New schedule">
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Report</span>
              <select
                className={styles.input}
                value={type}
                onChange={(event) => {
                  const next = REPORT_TYPES.find((item) => item.value === event.target.value);
                  if (next !== undefined) setType(next.value);
                }}
              >
                {REPORT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Every</span>
              <select
                className={styles.input}
                value={frequency}
                onChange={(event) => {
                  const next = ReportFrequencySchema.options.find(
                    (item) => item === event.target.value,
                  );
                  if (next !== undefined) setFrequency(next);
                }}
              >
                {ReportFrequencySchema.options.map((item) => (
                  <option key={item} value={item}>
                    {humanizeToken(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Currency</span>
              <select
                className={styles.input}
                value={currency}
                onChange={(event) => {
                  const next = BASE_CURRENCIES.find((item) => item === event.target.value);
                  if (next !== undefined) setCurrency(next);
                }}
              >
                {BASE_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Deliver to</span>
              <select
                className={styles.input}
                value={channelId}
                onChange={(event) => {
                  setChannelId(event.target.value);
                }}
              >
                {channels.data.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                    {channel.lastTest?.result === 'failed' ? ' (last test failed)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <Button
              isLoading={action.isPending}
              onPress={() => {
                action.mutate({
                  kind: 'create',
                  schedule: { type, frequency, currency, channelId },
                });
              }}
            >
              Add schedule
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Report history" extra={<span className={styles.meta}>Newest first</span>}>
        {runs.data.length === 0 ? (
          <p className={styles.note}>No reports have been sent yet.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Sent</th>
                  <th scope="col">Report</th>
                  <th scope="col">Period</th>
                  <th scope="col">To</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {runs.data.map((run) => (
                  <tr key={run.id}>
                    <td>{formatDateTime(run.generatedAt)}</td>
                    <td>
                      {typeLabel(run.type)} · {run.currency}
                    </td>
                    <td>
                      {run.period.from} to {run.period.to}
                    </td>
                    <td>{channelName(run.channelId)}</td>
                    <td>
                      <span className={styles.inline}>
                        <Badge variant={run.status === 'delivered' ? 'positive' : 'critical'}>
                          {humanizeToken(run.status)}
                        </Badge>
                        <span className={styles.meta}>{run.detail}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
