import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { SUPPORTED_CURRENCIES } from '../../../../shared/types/currency';
import { SUPPORTED_TIMEZONES } from '../../../../shared/types/dateTime';
import { humanizeToken } from '../../../../shared/format';
import { FieldError, NumberField, SelectField, TextField } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { WEEKDAYS } from '../model/marketDraft';
import { TimeField, type SectionProps } from './MarketFields';

type Session = SectionProps['draft']['regularHours'][number];
const DEFAULT_EXTENDED: Session = { start: { hour: 7, minute: 0 }, end: { hour: 9, minute: 0 } };

export function MarketIdentitySection({ draft, isNew, update, error }: SectionProps): ReactElement {
  return (
    <Card title="Identity">
      <div className={styles.fieldGrid}>
        <TextField
          label="Market code"
          value={draft.marketId}
          isDisabled={!isNew}
          hint={isNew ? 'Two to four capital letters. It cannot change later.' : 'Cannot change.'}
          error={error('marketId')}
          onChange={(value) => {
            update('marketId', (current) => ({ ...current, marketId: value.toUpperCase() }));
          }}
        />
        <TextField
          label="Name"
          value={draft.name}
          error={error('name')}
          onChange={(value) => {
            update('name', (current) => ({ ...current, name: value }));
          }}
        />
        <TextField
          label="Country"
          value={draft.country}
          error={error('country')}
          onChange={(value) => {
            update('country', (current) => ({ ...current, country: value }));
          }}
        />
        <TextField
          label="Exchange"
          value={draft.exchangeName}
          error={error('exchangeName')}
          onChange={(value) => {
            update('exchangeName', (current) => ({ ...current, exchangeName: value }));
          }}
        />
        <SelectField
          label="Currency"
          value={draft.currency}
          options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
          error={error('currency')}
          onChange={(value) => {
            update('currency', (current) => ({ ...current, currency: value }));
          }}
        />
        <SelectField
          label="Timezone"
          value={draft.timezone}
          options={SUPPORTED_TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
          error={error('timezone')}
          onChange={(value) => {
            update('timezone', (current) => ({ ...current, timezone: value }));
          }}
        />
        <NumberField
          label="Settlement (business days after trade)"
          value={draft.settlementDays}
          step="1"
          hint={`Trades settle on T+${Number.isNaN(draft.settlementDays) ? '?' : String(draft.settlementDays)}.`}
          error={error('settlementDays')}
          onChange={(value) => {
            update('settlementDays', (current) => ({ ...current, settlementDays: value }));
          }}
        />
      </div>
    </Card>
  );
}

export function MarketHoursSection({ draft, update, error }: SectionProps): ReactElement {
  const setSession = (index: number, session: Session): void => {
    update(`regularHours.${String(index)}`, (current) => ({
      ...current,
      regularHours: current.regularHours.map((item, at) => (at === index ? session : item)),
    }));
  };

  return (
    <Card
      title="Trading hours"
      extra={<span className={styles.meta}>Local time, {draft.timezone}</span>}
    >
      <div className={styles.stack}>
        <span className={styles.sectionTitle}>Regular sessions</span>
        <ul className={styles.rowList}>
          {draft.regularHours.map((session, index) => (
            <li key={String(index)} className={styles.row}>
              <TimeField
                label={`Session ${String(index + 1)} opens`}
                value={session.start}
                error={error(`regularHours.${String(index)}.start`)}
                onChange={(start) => {
                  setSession(index, { ...session, start });
                }}
              />
              <TimeField
                label="Closes"
                value={session.end}
                error={error(`regularHours.${String(index)}.end`)}
                onChange={(end) => {
                  setSession(index, { ...session, end });
                }}
              />
              {draft.regularHours.length > 1 && (
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    update('regularHours', (current) => ({
                      ...current,
                      regularHours: current.regularHours.filter((_, at) => at !== index),
                    }));
                  }}
                >
                  Remove session
                </button>
              )}
            </li>
          ))}
        </ul>
        <FieldError message={error('regularHours')} />
        <span className={styles.inline}>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              update('regularHours', (current) => {
                const last = current.regularHours[current.regularHours.length - 1];
                const start =
                  last === undefined
                    ? { hour: 9, minute: 0 }
                    : { ...last.end, hour: Math.min(last.end.hour + 1, 22) };
                return {
                  ...current,
                  regularHours: [
                    ...current.regularHours,
                    { start, end: { hour: Math.min(start.hour + 2, 23), minute: start.minute } },
                  ],
                };
              });
            }}
          >
            Add a session (for markets that close at lunch)
          </button>
        </span>
      </div>

      {(['preMarket', 'postMarket'] as const).map((key) => {
        const value = draft[key];
        const label = key === 'preMarket' ? 'Pre-market' : 'Post-market';
        return (
          <div key={key} className={styles.stack}>
            <label className={styles.checkOption}>
              <input
                type="checkbox"
                checked={value !== null}
                onChange={(event) => {
                  update(key, (current) => ({
                    ...current,
                    [key]: event.target.checked ? DEFAULT_EXTENDED : null,
                  }));
                }}
              />
              {label} session
            </label>
            {value !== null && (
              <div className={styles.row}>
                <TimeField
                  label={`${label} opens`}
                  value={value.start}
                  error={error(`${key}.start`)}
                  onChange={(start) => {
                    update(key, (current) => ({ ...current, [key]: { ...value, start } }));
                  }}
                />
                <TimeField
                  label="Closes"
                  value={value.end}
                  error={error(`${key}.end`)}
                  onChange={(end) => {
                    update(key, (current) => ({ ...current, [key]: { ...value, end } }));
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.stack}>
        <span className={styles.sectionTitle}>Closed every week on</span>
        <div className={styles.inline}>
          {WEEKDAYS.map((day) => (
            <label key={day} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={draft.weekendDays.includes(day)}
                onChange={(event) => {
                  update('weekendDays', (current) => ({
                    ...current,
                    weekendDays: event.target.checked
                      ? [...current.weekendDays, day]
                      : current.weekendDays.filter((item) => item !== day),
                  }));
                }}
              />
              {humanizeToken(day)}
            </label>
          ))}
        </div>
        <FieldError message={error('weekendDays')} />
      </div>
    </Card>
  );
}
