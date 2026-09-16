import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { InstrumentDto, StrategyDraftDto } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';
import styles from '../StrategyEditor.module.scss';

export interface SettingsProps {
  readonly draft: StrategyDraftDto;
  readonly onChange: (change: (draft: StrategyDraftDto) => StrategyDraftDto) => void;
}

interface NumberFieldProps {
  readonly label: string;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly nullable?: boolean;
  readonly suffix?: string;
}

// A nullable setting is "not set" rather than zero, because zero means something different for a
// stop loss than leaving it off entirely.
function NumberField({
  label,
  value,
  onChange,
  nullable = false,
  suffix,
}: NumberFieldProps): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {suffix === undefined ? '' : ` (${suffix})`}
      </span>
      <input
        type="number"
        className={styles.input}
        value={value === null ? '' : value}
        placeholder={nullable ? 'Not set' : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' && nullable ? null : Number(raw));
        }}
      />
    </label>
  );
}

export function ScopeSection({
  draft,
  onChange,
  instruments,
}: SettingsProps & { readonly instruments: readonly InstrumentDto[] }): ReactElement {
  const selected = draft.scope.instrumentIds.map(String);
  const markets = [...new Set(instruments.map((instrument) => String(instrument.marketId)))].sort();
  const types = [...new Set(instruments.map((instrument) => instrument.type))].sort();

  const toggleInstrument = (id: string, checked: boolean): void => {
    onChange((current) => ({
      ...current,
      scope: {
        ...current.scope,
        instrumentIds: (checked
          ? [...selected, id]
          : selected.filter((item) => item !== id)) as StrategyDraftDto['scope']['instrumentIds'],
      },
    }));
  };

  const toggleIn = (
    key: 'marketIds' | 'instrumentTypes',
    value: string,
    checked: boolean,
  ): void => {
    onChange((current) => ({
      ...current,
      scope: {
        ...current.scope,
        [key]: checked
          ? [...current.scope[key], value]
          : current.scope[key].filter((item) => item !== value),
      },
    }));
  };

  return (
    <Card
      title="Scope"
      extra={
        <span className={styles.meta}>
          {selected.length === 1 ? '1 instrument' : `${String(selected.length)} instruments`}
        </span>
      }
    >
      <p className={styles.note}>
        Which markets, instrument types and instruments this applies to.
      </p>

      <div className={styles.stack}>
        <span className={styles.fieldLabel}>Markets</span>
        <div className={styles.inline}>
          {markets.map((market) => (
            <label key={market} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={draft.scope.marketIds.includes(market)}
                onChange={(event) => {
                  toggleIn('marketIds', market, event.target.checked);
                }}
              />
              {market}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.stack}>
        <span className={styles.fieldLabel}>Instrument types</span>
        <div className={styles.inline}>
          {types.map((type) => (
            <label key={type} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={draft.scope.instrumentTypes.includes(type)}
                onChange={(event) => {
                  toggleIn('instrumentTypes', type, event.target.checked);
                }}
              />
              {humanizeToken(type)}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.stack}>
        <span className={styles.fieldLabel}>Instruments</span>
        <div className={styles.inline}>
          {instruments.map((instrument) => (
            <label key={String(instrument.id)} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={selected.includes(String(instrument.id))}
                onChange={(event) => {
                  toggleInstrument(String(instrument.id), event.target.checked);
                }}
              />
              {instrument.symbol}
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function SizingSection({ draft, onChange }: SettingsProps): ReactElement {
  return (
    <Card title="Position sizing and capital">
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Sizing method</span>
          <select
            className={styles.input}
            value={draft.sizing.method}
            onChange={(event) => {
              onChange((current) => ({
                ...current,
                sizing: {
                  ...current.sizing,
                  method: event.target.value as StrategyDraftDto['sizing']['method'],
                },
              }));
            }}
          >
            <option value="fixed_amount">Fixed amount</option>
            <option value="percent_of_capital">Percent of capital</option>
            <option value="risk_based">Risk based</option>
          </select>
        </label>
        <NumberField
          label={draft.sizing.method === 'fixed_amount' ? 'Amount per position' : 'Size'}
          suffix={draft.sizing.method === 'fixed_amount' ? 'currency' : '%'}
          value={draft.sizing.value}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              sizing: { ...current.sizing, value: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Max per position"
          suffix="%"
          value={draft.sizing.maxPositionPercent}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              sizing: { ...current.sizing, maxPositionPercent: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Max capital for this strategy"
          suffix="%"
          value={draft.allocation.maxCapitalPercent}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              allocation: { ...current.allocation, maxCapitalPercent: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Max concurrent positions"
          value={draft.allocation.maxConcurrentPositions}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              allocation: { ...current.allocation, maxConcurrentPositions: value ?? 0 },
            }));
          }}
        />
      </div>
    </Card>
  );
}

export function HoldingAndExitSection({ draft, onChange }: SettingsProps): ReactElement {
  return (
    <Card title="Holding period and forced exits">
      <p className={styles.note}>
        Forced exits fire whatever the exit conditions say, so a position cannot be held forever.
      </p>
      <div className={styles.fieldRow}>
        <NumberField
          label="Expected holding"
          suffix="days"
          value={draft.holdingPeriod.expectedDays}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              holdingPeriod: { ...current.holdingPeriod, expectedDays: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Minimum holding"
          suffix="days"
          value={draft.holdingPeriod.minDays}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              holdingPeriod: { ...current.holdingPeriod, minDays: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Maximum holding"
          suffix="days"
          value={draft.holdingPeriod.maxDays}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              holdingPeriod: { ...current.holdingPeriod, maxDays: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Stop loss"
          suffix="%"
          nullable
          value={draft.forcedExit.maxLossPercent}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              forcedExit: { ...current.forcedExit, maxLossPercent: value },
            }));
          }}
        />
        <NumberField
          label="Trailing stop"
          suffix="%"
          nullable
          value={draft.forcedExit.trailingStopPercent}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              forcedExit: { ...current.forcedExit, trailingStopPercent: value },
            }));
          }}
        />
        <NumberField
          label="Force exit after"
          suffix="days"
          nullable
          value={draft.forcedExit.maxHoldingDays}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              forcedExit: { ...current.forcedExit, maxHoldingDays: value },
            }));
          }}
        />
      </div>
    </Card>
  );
}

export function NewsAndRiskSection({ draft, onChange }: SettingsProps): ReactElement {
  return (
    <Card title="News inputs and risk overrides">
      <label className={styles.checkOption}>
        <input
          type="checkbox"
          checked={draft.news.isEnabled}
          onChange={(event) => {
            onChange((current) => ({
              ...current,
              news: { ...current.news, isEnabled: event.target.checked },
            }));
          }}
        />
        Use news and events in this strategy
      </label>
      <label className={styles.checkOption}>
        <input
          type="checkbox"
          checked={draft.news.blockAroundHighImpactEvents}
          disabled={!draft.news.isEnabled}
          onChange={(event) => {
            onChange((current) => ({
              ...current,
              news: { ...current.news, blockAroundHighImpactEvents: event.target.checked },
            }));
          }}
        />
        Do not trade around high-impact events
      </label>
      <div className={styles.fieldRow}>
        <NumberField
          label="Block window"
          suffix="hours"
          value={draft.news.blockWindowHours}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              news: { ...current.news, blockWindowHours: value ?? 0 },
            }));
          }}
        />
        <NumberField
          label="Minimum sentiment"
          nullable
          value={draft.news.minimumSentiment}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              news: { ...current.news, minimumSentiment: value },
            }));
          }}
        />
        <NumberField
          label="Max daily loss"
          suffix="%"
          nullable
          value={draft.risk.maxDailyLossPercent}
          onChange={(value) => {
            onChange((current) => ({
              ...current,
              risk: { ...current.risk, maxDailyLossPercent: value },
            }));
          }}
        />
        <NumberField
          label="Max leverage"
          nullable
          value={draft.risk.maxLeverage}
          onChange={(value) => {
            onChange((current) => ({ ...current, risk: { ...current.risk, maxLeverage: value } }));
          }}
        />
      </div>
    </Card>
  );
}
