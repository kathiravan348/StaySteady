import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveTaxRuleSet } from '../../../../data/api';
import type { TaxRuleSetConfigInput } from '../../../../data/schemas';
import { TaxRuleSetConfigSchema } from '../../../../data/schemas';
import {
  CapabilitySwitch,
  ConfigSaveCard,
  DateField,
  NumberField,
  SelectField,
  TextField,
  useConfigDraft,
} from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { ASSET_CLASS_OPTIONS, COST_BASIS_OPTIONS, MONTHS } from '../model/taxRulesDraft';
import { AssetClassRulesCard } from './AssetClassRulesCard';
import { ForeignAssetsCard } from './ForeignAssetsCard';

export interface TaxRuleSetFormProps {
  readonly initial: TaxRuleSetConfigInput;
  readonly onCancel: () => void;
}

const MONTH_OPTIONS = MONTHS.map((label, index) => ({ value: String(index + 1), label }));

// Requirements 26 — tax rules are configuration per country of residence and asset class.
export function TaxRuleSetForm({ initial, onCancel }: TaxRuleSetFormProps): ReactElement {
  const save = useSaveTaxRuleSet();
  const form = useConfigDraft(initial, TaxRuleSetConfigSchema);
  const { draft, update, error } = form;
  const carriesForever = draft.lossCarryForwardYears === null;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>{draft.country}</strong>
          {draft.isResidence && <Badge variant="info">Country of residence</Badge>}
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      <Card title="Tax year and cost basis">
        <div className={styles.stack}>
          <CapabilitySwitch
            label="Country of residence"
            description="The residence rules decide every tax estimate. Exactly one rule set is the residence."
            isSelected={draft.isResidence}
            onChange={(isResidence) => {
              update('isResidence', (current) => ({ ...current, isResidence }));
            }}
          />
          <div className={styles.fieldGrid}>
            <SelectField
              label="Tax year starts in"
              value={String(draft.taxYearStart.month)}
              options={MONTH_OPTIONS}
              error={error('taxYearStart.month')}
              onChange={(value) => {
                update('taxYearStart.month', (current) => ({
                  ...current,
                  taxYearStart: { ...current.taxYearStart, month: Number(value) },
                }));
              }}
            />
            <NumberField
              label="On day"
              step="1"
              value={draft.taxYearStart.day}
              error={error('taxYearStart.day')}
              onChange={(day) => {
                update('taxYearStart.day', (current) => ({
                  ...current,
                  taxYearStart: { ...current.taxYearStart, day },
                }));
              }}
            />
            <SelectField
              label="Cost basis on disposal"
              value={draft.costBasisMethod}
              options={COST_BASIS_OPTIONS}
              error={error('costBasisMethod')}
              onChange={(costBasisMethod) => {
                update('costBasisMethod', (current) => ({ ...current, costBasisMethod }));
              }}
            />
            {!carriesForever && (
              <NumberField
                label="Losses carried forward (years)"
                step="1"
                value={draft.lossCarryForwardYears ?? Number.NaN}
                error={error('lossCarryForwardYears')}
                onChange={(lossCarryForwardYears) => {
                  update('lossCarryForwardYears', (current) => ({
                    ...current,
                    lossCarryForwardYears,
                  }));
                }}
              />
            )}
          </div>
          <CapabilitySwitch
            label="Losses never expire"
            description="On when capital losses can be carried forward indefinitely."
            isSelected={carriesForever}
            onChange={(isSelected) => {
              update('lossCarryForwardYears', (current) => ({
                ...current,
                lossCarryForwardYears: isSelected ? null : 8,
              }));
            }}
          />
        </div>
      </Card>

      <AssetClassRulesCard form={form} />

      <Card title="Cost basis protections">
        <div className={styles.stack}>
          <ul className={styles.rowList} aria-label="Cost basis protections">
            {draft.costBasisProtections.map((item, index) => (
              <li key={String(index)} className={styles.row}>
                <SelectField
                  label="Asset class"
                  value={item.assetClass}
                  options={ASSET_CLASS_OPTIONS}
                  error={undefined}
                  onChange={(assetClass) => {
                    update(`costBasisProtections.${String(index)}`, (current) => ({
                      ...current,
                      costBasisProtections: current.costBasisProtections.map((entry, at) =>
                        at === index ? { ...entry, assetClass } : entry,
                      ),
                    }));
                  }}
                />
                <DateField
                  label="Bought before"
                  value={String(item.acquiredBefore)}
                  error={error(`costBasisProtections.${String(index)}.acquiredBefore`)}
                  onChange={(acquiredBefore) => {
                    update(`costBasisProtections.${String(index)}.acquiredBefore`, (current) => ({
                      ...current,
                      costBasisProtections: current.costBasisProtections.map((entry, at) =>
                        at === index ? { ...entry, acquiredBefore } : entry,
                      ),
                    }));
                  }}
                />
                <TextField
                  label="What it does"
                  value={item.description}
                  error={error(`costBasisProtections.${String(index)}.description`)}
                  onChange={(description) => {
                    update(`costBasisProtections.${String(index)}.description`, (current) => ({
                      ...current,
                      costBasisProtections: current.costBasisProtections.map((entry, at) =>
                        at === index ? { ...entry, description } : entry,
                      ),
                    }));
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    update('costBasisProtections', (current) => ({
                      ...current,
                      costBasisProtections: current.costBasisProtections.filter(
                        (_, at) => at !== index,
                      ),
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
                update('costBasisProtections', (current) => ({
                  ...current,
                  costBasisProtections: [
                    ...current.costBasisProtections,
                    { assetClass: 'domestic_equity', acquiredBefore: '', description: '' },
                  ],
                }));
              }}
            >
              Add a protection
            </Button>
          </div>
        </div>
      </Card>

      <ForeignAssetsCard form={form} />

      <p className={styles.meta}>
        Rules to plan with, not tax advice. Check the figures against current law before relying on
        them.
      </p>

      <ConfigSaveCard
        title="Save changes"
        form={form}
        isNew={false}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel="Save as a new version"
        onSave={(reason) => {
          save.mutate({ isNew: false, id: draft.country, config: draft, reason });
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
