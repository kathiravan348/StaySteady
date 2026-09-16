import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { BacktestConfigDto, StrategyDto } from '../../../../data/schemas';
import { formatIsoDate, humanizeToken, pluralize } from '../../../../shared/format';
import { toIsoDate } from '../../../../shared/types/dateTime';
import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import type { RangePreset } from '../model/backtestConfig';
import { daysBetween, RANGE_PRESETS, rangeForPreset } from '../model/backtestConfig';
import styles from '../BacktestSetup.module.scss';

export interface StrategyAndRangeSectionProps {
  readonly strategies: readonly StrategyDto[];
  readonly strategy: StrategyDto;
  readonly config: BacktestConfigDto;
  readonly rangePreset: RangePreset;
  readonly onSelectStrategy: (strategyId: string) => void;
  readonly onChange: (change: Partial<BacktestConfigDto>) => void;
  readonly onRangePreset: (preset: RangePreset) => void;
}

// UI spec 7.9 — strategy selection and the date range, with presets.
export function StrategyAndRangeSection(props: StrategyAndRangeSectionProps): ReactElement {
  const { config, strategy } = props;
  const today = new Date().toISOString().slice(0, 10);
  const rangeDays = daysBetween(config.startDate, config.endDate);

  return (
    <Card title="Strategy and period">
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Strategy</span>
          <select
            className={styles.input}
            value={config.strategyId}
            onChange={(event) => {
              props.onSelectStrategy(event.target.value);
            }}
          >
            {props.strategies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Strategy details</span>
          <div className={styles.badges}>
            <Badge variant="info">{humanizeToken(strategy.stage)}</Badge>
            <Badge variant="neutral">Version {strategy.version}</Badge>
            <Badge variant="neutral">{strategy.timeframe} timeframe</Badge>
          </div>
          <p className={styles.note}>{strategy.description}</p>
        </div>
      </div>
      <ToggleGroup
        label="Date range"
        options={RANGE_PRESETS}
        value={props.rangePreset}
        onChange={(preset) => {
          props.onRangePreset(preset);
          if (preset !== 'Custom') {
            props.onChange(rangeForPreset(preset, today, config) as Partial<BacktestConfigDto>);
          }
        }}
      />
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Start date</span>
          <input
            type="date"
            className={styles.input}
            value={config.startDate}
            max={today}
            onChange={(event) => {
              props.onChange({ startDate: event.target.value } as Partial<BacktestConfigDto>);
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>End date</span>
          <input
            type="date"
            className={styles.input}
            value={config.endDate}
            max={today}
            onChange={(event) => {
              props.onChange({ endDate: event.target.value } as Partial<BacktestConfigDto>);
            }}
          />
        </label>
      </div>
      <p className={styles.note}>
        {rangeDays > 0
          ? `${formatIsoDate(toIsoDate(config.startDate))} to ${formatIsoDate(toIsoDate(config.endDate))} · ${pluralize(rangeDays, 'calendar day')}`
          : 'Choose a start date before the end date.'}
      </p>
    </Card>
  );
}
