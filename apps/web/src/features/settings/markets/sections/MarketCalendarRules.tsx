import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { InstrumentTypeSchema } from '../../../../data/schemas';
import { CapabilitySwitch, FieldError, NumberField, TextField } from '../../../../shared/config';
import { humanizeToken } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import { weekendHolidays } from '../model/marketDraft';
import type { SectionProps } from './MarketFields';

export function MarketCalendarSection({ draft, update, error }: SectionProps): ReactElement {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const onWeekend = weekendHolidays(draft);
  const sorted = draft.holidays
    .map((holiday, index) => ({ holiday, index }))
    .sort((a, b) => b.holiday.date.localeCompare(a.holiday.date));

  return (
    <Card
      title="Holiday calendar"
      extra={<span className={styles.meta}>{draft.holidays.length} dates</span>}
    >
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Date</span>
          <input
            type="date"
            className={styles.input}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
            }}
          />
        </label>
        <TextField label="Holiday" value={name} error={undefined} onChange={setName} />
        <button
          type="button"
          className={styles.link}
          disabled={date === '' || name.trim() === ''}
          onClick={() => {
            update('holidays', (current) => ({
              ...current,
              holidays: [...current.holidays, { date, name: name.trim(), isHalfDay: false }],
            }));
            setDate('');
            setName('');
          }}
        >
          Add holiday
        </button>
      </div>

      {onWeekend.length > 0 && (
        <p className={styles.meta}>
          {onWeekend.join(', ')} {onWeekend.length === 1 ? 'falls' : 'fall'} on a weekend day. That
          is allowed, since exchanges list such holidays, but it closes nothing extra.
        </p>
      )}

      <ul className={styles.rowList}>
        {sorted.map(({ holiday, index }) => (
          <li key={`${holiday.date}-${String(index)}`} className={styles.stack}>
            <span className={styles.inline}>
              <span className={styles.note}>
                {holiday.date} · {holiday.name}
              </span>
              <label className={styles.checkOption}>
                <input
                  type="checkbox"
                  checked={holiday.isHalfDay}
                  onChange={(event) => {
                    update(`holidays.${String(index)}`, (current) => ({
                      ...current,
                      holidays: current.holidays.map((item, at) =>
                        at === index ? { ...item, isHalfDay: event.target.checked } : item,
                      ),
                    }));
                  }}
                />
                Half day
              </label>
              <button
                type="button"
                className={styles.link}
                onClick={() => {
                  update('holidays', (current) => ({
                    ...current,
                    holidays: current.holidays.filter((_, at) => at !== index),
                  }));
                }}
              >
                Remove
              </button>
            </span>
            <FieldError message={error(`holidays.${String(index)}.date`)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MarketRulesSection({ draft, isNew, update, error }: SectionProps): ReactElement {
  const fee = (key: keyof SectionProps['draft']['fees'], value: number | string): void => {
    update(`fees.${key}`, (current) => ({ ...current, fees: { ...current.fees, [key]: value } }));
  };

  return (
    <>
      <Card title="Fees" extra={<span className={styles.meta}>Charged per trade</span>}>
        <div className={styles.fieldGrid}>
          <NumberField
            label="Commission (bps)"
            value={draft.fees.commissionBps}
            error={error('fees.commissionBps')}
            onChange={(value) => {
              fee('commissionBps', value);
            }}
          />
          <TextField
            label={`Minimum commission (${draft.currency})`}
            value={draft.fees.minimumCommission}
            error={error('fees.minimumCommission')}
            onChange={(value) => {
              fee('minimumCommission', value);
            }}
          />
          <NumberField
            label="Exchange fee (bps)"
            value={draft.fees.exchangeFeeBps}
            error={error('fees.exchangeFeeBps')}
            onChange={(value) => {
              fee('exchangeFeeBps', value);
            }}
          />
          <NumberField
            label="Stamp duty or transaction tax (bps)"
            value={draft.fees.transactionTaxBps}
            error={error('fees.transactionTaxBps')}
            onChange={(value) => {
              fee('transactionTaxBps', value);
            }}
          />
        </div>
      </Card>

      <Card
        title="Tax at source"
        extra={<span className={styles.meta}>Gains tax: Settings, Tax rules</span>}
      >
        <div className={styles.fieldGrid}>
          <NumberField
            label="Dividend withholding (%)"
            value={draft.tax.dividendWithholdingPercent}
            hint="Deducted by this market before a dividend is paid."
            error={error('tax.dividendWithholdingPercent')}
            onChange={(value) => {
              update('tax.dividendWithholdingPercent', (current) => ({
                ...current,
                tax: { dividendWithholdingPercent: value },
              }));
            }}
          />
        </div>
      </Card>

      <Card title="Permitted instrument types">
        <div className={styles.inline}>
          {InstrumentTypeSchema.options.map((type) => (
            <label key={type} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={draft.permittedInstrumentTypes.includes(type)}
                onChange={(event) => {
                  update('permittedInstrumentTypes', (current) => ({
                    ...current,
                    permittedInstrumentTypes: event.target.checked
                      ? [...current.permittedInstrumentTypes, type]
                      : current.permittedInstrumentTypes.filter((item) => item !== type),
                  }));
                }}
              />
              {humanizeToken(type)}
            </label>
          ))}
        </div>
        <FieldError message={error('permittedInstrumentTypes')} />
      </Card>

      <Card title="Capabilities">
        <CapabilitySwitch
          label="Enabled"
          description="A disabled market is kept but nothing uses it: no quotes, signals or orders."
          isSelected={draft.enabled}
          onChange={(value) => {
            update('enabled', (current) => ({ ...current, enabled: value }));
          }}
        />
        <CapabilitySwitch
          label="Automation permitted"
          description="Strategies may place orders here without asking. Off means every order waits for approval."
          isSelected={draft.automationPermitted}
          onChange={(value) => {
            update('automationPermitted', (current) => ({
              ...current,
              automationPermitted: value,
            }));
          }}
        />
        <CapabilitySwitch
          label="Live"
          description={
            isNew
              ? 'A new market is saved in simulation first. Switch it to live once it has been checked.'
              : 'Off means orders here are simulated and never reach a broker.'
          }
          isSelected={draft.mode === 'live'}
          isDisabled={isNew}
          onChange={(value) => {
            update('mode', (current) => ({ ...current, mode: value ? 'live' : 'simulation' }));
          }}
        />
      </Card>
    </>
  );
}
