import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type {
  ManualCostItemInput,
  OperatingCostSummaryDto,
  OperatingPolicyConfigInput,
} from '../../../../data/schemas';
import type { ConfigDraft } from '../../../../shared/config';
import { NumberField, SelectField, TextField } from '../../../../shared/config';
import { formatMoney } from '../../../../shared/format';
import { BASE_CURRENCIES } from '../../../../shared/types/currency';
import styles from '../../Settings.module.scss';
import { CATEGORY_OPTIONS, newManualItem, percentFromBps } from '../model/assumptionsDraft';

export interface CostBudgetCardProps {
  readonly form: ConfigDraft<OperatingPolicyConfigInput>;
  // Worked out by the server from the saved version, not the unsaved form.
  readonly costs: OperatingCostSummaryDto;
}

type Budget = OperatingPolicyConfigInput['costBudget'];

// Requirements 34 — running cost per month against a budget, and as a share of portfolio value.
export function CostBudgetCard({ form, costs }: CostBudgetCardProps): ReactElement {
  const { draft, update, error } = form;
  const budget = draft.costBudget;
  const setBudget = (path: string, change: (current: Budget) => Budget): void => {
    update(`costBudget.${path}`, (current) => ({
      ...current,
      costBudget: change(current.costBudget),
    }));
  };
  const setItem = (
    index: number,
    change: (item: ManualCostItemInput) => ManualCostItemInput,
  ): void => {
    setBudget(`manualItems.${String(index)}`, (current) => ({
      ...current,
      manualItems: current.manualItems.map((item, at) => (at === index ? change(item) : item)),
    }));
  };
  const share = costs.yearlyShareOfPortfolioBps;

  return (
    <Card title="Monthly running cost">
      <div className={styles.stack}>
        <div className={styles.fieldGrid}>
          <SelectField
            label="Budget currency"
            value={budget.currency}
            options={BASE_CURRENCIES.map((code) => ({ value: code, label: code }))}
            error={error('costBudget.currency')}
            onChange={(currency) => {
              setBudget('currency', (current) => ({ ...current, currency }));
            }}
          />
          <TextField
            label="Monthly budget"
            value={budget.monthlyBudget}
            error={error('costBudget.monthlyBudget')}
            onChange={(monthlyBudget) => {
              setBudget('monthlyBudget', (current) => ({ ...current, monthlyBudget }));
            }}
          />
          <NumberField
            label="Warn at (% of budget)"
            step="1"
            value={budget.warnAtPercent}
            error={error('costBudget.warnAtPercent')}
            onChange={(warnAtPercent) => {
              setBudget('warnAtPercent', (current) => ({ ...current, warnAtPercent }));
            }}
          />
          <NumberField
            label="Largest yearly cost (bps of portfolio)"
            step="1"
            value={budget.maxShareOfPortfolioBps}
            hint={`${percentFromBps(budget.maxShareOfPortfolioBps)} of portfolio value a year`}
            error={error('costBudget.maxShareOfPortfolioBps')}
            onChange={(maxShareOfPortfolioBps) => {
              setBudget('maxShareOfPortfolioBps', (current) => ({
                ...current,
                maxShareOfPortfolioBps,
              }));
            }}
          />
        </div>

        <h3 className={styles.sectionTitle}>Costs outside data provider configuration</h3>
        <ul className={styles.rowList} aria-label="Manual cost items">
          {budget.manualItems.map((item, index) => (
            <li key={item.id} className={styles.row}>
              <TextField
                label="Cost"
                value={item.label}
                error={error(`costBudget.manualItems.${String(index)}.label`)}
                onChange={(label) => {
                  setItem(index, (current) => ({ ...current, label }));
                }}
              />
              <SelectField
                label="Category"
                value={item.category}
                options={CATEGORY_OPTIONS}
                error={undefined}
                onChange={(category) => {
                  setItem(index, (current) => ({ ...current, category }));
                }}
              />
              <TextField
                label={`Per month (${budget.currency})`}
                value={item.monthlyAmount}
                error={error(`costBudget.manualItems.${String(index)}.monthlyAmount`)}
                onChange={(monthlyAmount) => {
                  setItem(index, (current) => ({ ...current, monthlyAmount }));
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  setBudget('manualItems', (current) => ({
                    ...current,
                    manualItems: current.manualItems.filter((_, at) => at !== index),
                  }));
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <div className={styles.inline}>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              setBudget('manualItems', (current) => ({
                ...current,
                manualItems: [...current.manualItems, newManualItem(current.manualItems)],
              }));
            }}
          >
            Add a cost
          </Button>
        </div>

        <h3 className={styles.sectionTitle}>Saved version, this month</h3>
        <ul className={styles.rowList} aria-label="Running cost lines">
          {costs.lines.map((line) => (
            <li key={`${line.source}-${line.label}`} className={styles.row}>
              <span className={styles.note}>{line.label}</span>
              <Badge variant="neutral">
                {line.source === 'provider' ? 'Data provider' : 'Manual'}
              </Badge>
              <span className={styles.note}>{formatMoney(moneyFromDto(line.monthlyAmount))}</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          {formatMoney(moneyFromDto(costs.monthlyTotal))} a month,{' '}
          {costs.budgetUsedPercent.toFixed(0)}% of budget
          {share === null
            ? '; portfolio value unknown.'
            : `; ${percentFromBps(share)} of portfolio value a year.`}
        </p>
      </div>
    </Card>
  );
}
