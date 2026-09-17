import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { AssetClassTaxRuleInput, TaxRuleSetConfigInput } from '../../../../data/schemas';
import type { ConfigDraft } from '../../../../shared/config';
import { CapabilitySwitch, NumberField, SelectField, TextField } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { ASSET_CLASS_OPTIONS } from '../model/taxRulesDraft';

const DEFAULT_RULE: AssetClassTaxRuleInput = {
  assetClass: 'other',
  longTermAfterDays: null,
  shortTermRatePercent: 30,
  longTermRatePercent: 30,
  longTermExemption: '0.00',
};

// Requirements 26 — distinct short and long-term treatment per asset class, each with its own
// holding period, rate and exemption.
export function AssetClassRulesCard({
  form,
}: {
  readonly form: ConfigDraft<TaxRuleSetConfigInput>;
}): ReactElement {
  const { draft, update, error } = form;
  const setRule = (
    index: number,
    field: string,
    change: (rule: AssetClassTaxRuleInput) => AssetClassTaxRuleInput,
  ): void => {
    update(`rules.${String(index)}.${field}`, (current) => ({
      ...current,
      rules: current.rules.map((rule, at) => (at === index ? change(rule) : rule)),
    }));
  };
  const unused = ASSET_CLASS_OPTIONS.find(
    (option) => !draft.rules.some((rule) => rule.assetClass === option.value),
  );

  return (
    <Card title="Gains by asset class">
      <ul className={styles.rowList} aria-label="Tax rules by asset class">
        {draft.rules.map((rule, index) => {
          const path = (field: string): string => `rules.${String(index)}.${field}`;
          const hasLongTerm = rule.longTermAfterDays !== null;
          return (
            <li key={`${rule.assetClass}-${String(index)}`} className={styles.stack}>
              <div className={styles.row}>
                <SelectField
                  label="Asset class"
                  value={rule.assetClass}
                  options={ASSET_CLASS_OPTIONS}
                  error={error(path('assetClass'))}
                  onChange={(assetClass) => {
                    setRule(index, 'assetClass', (current) => ({ ...current, assetClass }));
                  }}
                />
                <NumberField
                  label="Short-term rate (%)"
                  value={rule.shortTermRatePercent}
                  error={error(path('shortTermRatePercent'))}
                  onChange={(value) => {
                    setRule(index, 'shortTermRatePercent', (current) => ({
                      ...current,
                      shortTermRatePercent: value,
                      longTermRatePercent: hasLongTerm ? current.longTermRatePercent : value,
                    }));
                  }}
                />
                {hasLongTerm && (
                  <>
                    <NumberField
                      label="Long-term after (days)"
                      step="1"
                      value={rule.longTermAfterDays ?? Number.NaN}
                      error={error(path('longTermAfterDays'))}
                      onChange={(value) => {
                        setRule(index, 'longTermAfterDays', (current) => ({
                          ...current,
                          longTermAfterDays: value,
                        }));
                      }}
                    />
                    <NumberField
                      label="Long-term rate (%)"
                      value={rule.longTermRatePercent}
                      error={error(path('longTermRatePercent'))}
                      onChange={(value) => {
                        setRule(index, 'longTermRatePercent', (current) => ({
                          ...current,
                          longTermRatePercent: value,
                        }));
                      }}
                    />
                    <TextField
                      label={`Yearly long-term exemption (${draft.currency})`}
                      value={rule.longTermExemption}
                      error={error(path('longTermExemption'))}
                      onChange={(value) => {
                        setRule(index, 'longTermExemption', (current) => ({
                          ...current,
                          longTermExemption: value,
                        }));
                      }}
                    />
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  isDisabled={draft.rules.length === 1}
                  onPress={() => {
                    update('rules', (current) => ({
                      ...current,
                      rules: current.rules.filter((_, at) => at !== index),
                    }));
                  }}
                >
                  Remove
                </Button>
              </div>
              <CapabilitySwitch
                label="Long-term treatment after a holding period"
                description="Off taxes every gain in this class at the short-term rate."
                isSelected={hasLongTerm}
                onChange={(isSelected) => {
                  setRule(index, 'longTermAfterDays', (current) => ({
                    ...current,
                    longTermAfterDays: isSelected ? 365 : null,
                    longTermRatePercent: isSelected
                      ? current.longTermRatePercent
                      : current.shortTermRatePercent,
                    longTermExemption: isSelected ? current.longTermExemption : '0.00',
                  }));
                }}
              />
            </li>
          );
        })}
      </ul>
      {unused !== undefined && (
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            update('rules', (current) => ({
              ...current,
              rules: [...current.rules, { ...DEFAULT_RULE, assetClass: unused.value }],
            }));
          }}
        >
          Add an asset class
        </Button>
      )}
    </Card>
  );
}
