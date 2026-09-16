import type { ReactElement } from 'react';

import type {
  ComparatorDto,
  IndicatorKindDto,
  PriceFieldDto,
  RuleConditionDto,
  RuleOperandDto,
} from '../../../../data/schemas';
import { COMPARATOR_LABELS, INDICATOR_LABELS } from '../model/ruleTree';
import styles from '../StrategyEditor.module.scss';

const PRICE_FIELDS: readonly PriceFieldDto[] = ['open', 'high', 'low', 'close', 'volume'];
const INDICATORS = Object.keys(INDICATOR_LABELS) as readonly IndicatorKindDto[];
const COMPARATORS = Object.keys(COMPARATOR_LABELS) as readonly ComparatorDto[];

interface OperandEditorProps {
  readonly label: string;
  readonly operand: RuleOperandDto;
  readonly onChange: (operand: RuleOperandDto) => void;
}

// One operand: a price field, an indicator with a period, or a fixed number.
function OperandEditor({ label, operand, onChange }: OperandEditorProps): ReactElement {
  return (
    <>
      <label className={styles.field}>
        <span className={styles.visuallyHidden}>{label} kind</span>
        <select
          className={styles.input}
          value={operand.kind}
          onChange={(event) => {
            const kind = event.target.value;
            if (kind === 'price') onChange({ kind: 'price', field: 'close' });
            else if (kind === 'number') onChange({ kind: 'number', value: 0 });
            else onChange({ kind: 'indicator', indicator: 'sma', period: 20 });
          }}
        >
          <option value="price">Price</option>
          <option value="indicator">Indicator</option>
          <option value="number">Number</option>
        </select>
      </label>

      {operand.kind === 'price' && (
        <label className={styles.field}>
          <span className={styles.visuallyHidden}>{label} price field</span>
          <select
            className={styles.input}
            value={operand.field}
            onChange={(event) => {
              onChange({ kind: 'price', field: event.target.value as PriceFieldDto });
            }}
          >
            {PRICE_FIELDS.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </label>
      )}

      {operand.kind === 'indicator' && (
        <>
          <label className={styles.field}>
            <span className={styles.visuallyHidden}>{label} indicator</span>
            <select
              className={styles.input}
              value={operand.indicator}
              onChange={(event) => {
                onChange({
                  kind: 'indicator',
                  indicator: event.target.value as IndicatorKindDto,
                  period: operand.period,
                });
              }}
            >
              {INDICATORS.map((indicator) => (
                <option key={indicator} value={indicator}>
                  {INDICATOR_LABELS[indicator]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.visuallyHidden}>{label} period</span>
            <input
              type="number"
              className={`${styles.input} ${styles.narrowInput}`}
              min={1}
              max={400}
              value={operand.period}
              onChange={(event) => {
                onChange({
                  kind: 'indicator',
                  indicator: operand.indicator,
                  period: Number(event.target.value),
                });
              }}
            />
          </label>
        </>
      )}

      {operand.kind === 'number' && (
        <label className={styles.field}>
          <span className={styles.visuallyHidden}>{label} value</span>
          <input
            type="number"
            className={`${styles.input} ${styles.narrowInput}`}
            value={operand.value}
            onChange={(event) => {
              onChange({ kind: 'number', value: Number(event.target.value) });
            }}
          />
        </label>
      )}
    </>
  );
}

export interface ConditionRowProps {
  readonly condition: RuleConditionDto;
  readonly onChange: (condition: RuleConditionDto) => void;
  readonly onRemove: () => void;
}

export function ConditionRow({ condition, onChange, onRemove }: ConditionRowProps): ReactElement {
  return (
    <div className={styles.condition}>
      <OperandEditor
        label="Left"
        operand={condition.left}
        onChange={(left) => {
          onChange({ ...condition, left });
        }}
      />

      <label className={styles.field}>
        <span className={styles.visuallyHidden}>Comparator</span>
        <select
          className={styles.input}
          value={condition.comparator}
          onChange={(event) => {
            onChange({ ...condition, comparator: event.target.value as ComparatorDto });
          }}
        >
          {COMPARATORS.map((comparator) => (
            <option key={comparator} value={comparator}>
              {COMPARATOR_LABELS[comparator]}
            </option>
          ))}
        </select>
      </label>

      <OperandEditor
        label="Right"
        operand={condition.right}
        onChange={(right) => {
          onChange({ ...condition, right });
        }}
      />

      <button type="button" className={styles.link} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}
