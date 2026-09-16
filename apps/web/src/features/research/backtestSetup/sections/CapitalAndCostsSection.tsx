import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type {
  BacktestConfigDto,
  CostAssumptionsDto,
  MarketCostDefaultsDto,
} from '../../../../data/schemas';
import { SUPPORTED_CURRENCIES } from '../../../../shared/types/currency';
import type { BacktestGranularityDto } from '../../../../data/schemas';
import { GRANULARITIES, GRANULARITY_LABELS } from '../model/backtestConfig';
import styles from '../BacktestSetup.module.scss';

export interface CapitalAndCostsSectionProps {
  readonly config: BacktestConfigDto;
  readonly costDefaults: readonly MarketCostDefaultsDto[];
  readonly onChange: (change: Partial<BacktestConfigDto>) => void;
  readonly onResetCosts: () => void;
}

const COST_FIELDS: readonly {
  readonly key: 'commissionBps' | 'slippageBps' | 'fxConversionBps';
  readonly label: string;
  readonly hint: string;
}[] = [
  { key: 'commissionBps', label: 'Commission (bps)', hint: 'Broker commission per trade' },
  {
    key: 'slippageBps',
    label: 'Slippage (bps)',
    hint: 'Assumed difference from the modelled price',
  },
  { key: 'fxConversionBps', label: 'Currency conversion (bps)', hint: 'Charged when converting' },
];

// UI spec 7.9 — starting capital and currency, cost assumptions, granularity and benchmarks.
export function CapitalAndCostsSection(props: CapitalAndCostsSectionProps): ReactElement {
  const { config } = props;
  const setCosts = (change: Partial<CostAssumptionsDto>): void => {
    props.onChange({ costs: { ...config.costs, ...change } } as Partial<BacktestConfigDto>);
  };

  return (
    <Card
      title="Capital, costs and data"
      extra={
        <button type="button" className={styles.textButton} onClick={props.onResetCosts}>
          Reset to live configuration
        </button>
      }
    >
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Starting capital</span>
          <input
            type="text"
            inputMode="decimal"
            className={styles.input}
            value={config.initialCapital.amount}
            onChange={(event) => {
              props.onChange({
                initialCapital: { ...config.initialCapital, amount: event.target.value },
              } as Partial<BacktestConfigDto>);
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Currency</span>
          <select
            className={styles.input}
            value={config.initialCapital.currency}
            onChange={(event) => {
              props.onChange({
                initialCapital: { ...config.initialCapital, currency: event.target.value },
              } as Partial<BacktestConfigDto>);
            }}
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Data granularity</span>
          <select
            className={styles.input}
            value={config.granularity}
            onChange={(event) => {
              const granularity = GRANULARITIES.find((option) => option === event.target.value);
              if (granularity !== undefined) {
                props.onChange({ granularity } as Partial<BacktestConfigDto>);
              }
            }}
          >
            {GRANULARITIES.map((option: BacktestGranularityDto) => (
              <option key={option} value={option}>
                {GRANULARITY_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.grid}>
        {COST_FIELDS.map((field) => (
          <label key={field.key} className={styles.field}>
            <span className={styles.fieldLabel}>{field.label}</span>
            <input
              type="number"
              min={0}
              max={500}
              step={1}
              className={styles.input}
              value={config.costs[field.key]}
              onChange={(event) => {
                setCosts({ [field.key]: Number(event.target.value) });
              }}
            />
            <span className={styles.meta}>{field.hint}</span>
          </label>
        ))}
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Minimum commission ({config.costs.minimumCommission.currency})
          </span>
          <input
            type="text"
            inputMode="decimal"
            className={styles.input}
            value={config.costs.minimumCommission.amount}
            onChange={(event) => {
              setCosts({
                minimumCommission: {
                  ...config.costs.minimumCommission,
                  amount: event.target.value,
                },
              });
            }}
          />
          <span className={styles.meta}>Charged when the percentage is smaller</span>
        </label>
      </div>
      <fieldset className={styles.fieldset}>
        <legend className={styles.fieldLabel}>Benchmark per market</legend>
        <div className={styles.grid}>
          {config.benchmarks.map((benchmark) => {
            const market = props.costDefaults.find((item) => item.marketId === benchmark.marketId);
            return (
              <p key={benchmark.marketId} className={styles.note}>
                <strong>{market?.marketName ?? benchmark.marketId}:</strong>{' '}
                {market?.benchmarkLabel ?? 'No benchmark instrument available'}
              </p>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}
