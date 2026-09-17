// Modal form dialog for adding restricted instruments (requirements 27; UI spec 19.1).

import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { Button } from '@staysteady/ui';

import type {
  AddRestrictedInstrumentInput,
  RestrictedReasonCategory,
} from '../../../data/schemas/compliance';
import {
  AddRestrictedInstrumentInputSchema,
  RestrictedReasonCategorySchema,
} from '../../../data/schemas/compliance';
import { REASON_CATEGORY_LABELS } from '../model/complianceLabels';
import styles from '../Compliance.module.scss';

export interface AddRestrictedModalProps {
  readonly isOpen: boolean;
  readonly isMutating: boolean;
  readonly onClose: () => void;
  readonly onAdd: (input: AddRestrictedInstrumentInput) => Promise<void>;
}

const INITIAL_FORM: AddRestrictedInstrumentInput = {
  symbol: '',
  name: '',
  assetClass: 'EQUITY',
  jurisdiction: 'US',
  reasonCategory: 'EMPLOYER_EQUITY',
  policyClause: 'Staff Personal Dealing Rules §2.1',
  notes: '',
};

export const AddRestrictedModal: FC<AddRestrictedModalProps> = ({
  isOpen,
  isMutating,
  onClose,
  onAdd,
}) => {
  const [form, setForm] = useState<AddRestrictedInstrumentInput>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = AddRestrictedInstrumentInputSchema.safeParse({
      ...form,
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      policyClause: form.policyClause.trim(),
      notes: form.notes.trim(),
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    try {
      await onAdd(parsed.data);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add restricted instrument');
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.inlineBetween}>
          <h3 className={styles.bannerText}>Add Restricted Instrument</h3>
          <Button variant="ghost" size="sm" onPress={onClose}>
            ✕
          </Button>
        </div>

        {formError && (
          <div className={`${styles.banner} ${styles.bannerCritical}`}>
            <p className={styles.bannerText}>{formError}</p>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className={styles.stack}>
          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label htmlFor="res-form-symbol" className={styles.fieldLabel}>
                Symbol
              </label>
              <input
                id="res-form-symbol"
                className={styles.input}
                required
                value={form.symbol}
                onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                placeholder="e.g. MSFT"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="res-form-name" className={styles.fieldLabel}>
                Instrument Name
              </label>
              <input
                id="res-form-name"
                className={styles.input}
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Microsoft Corporation"
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label htmlFor="res-form-assetClass" className={styles.fieldLabel}>
                Asset Class
              </label>
              <select
                id="res-form-assetClass"
                className={styles.select}
                value={form.assetClass}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    assetClass: e.target.value as 'EQUITY' | 'DERIVATIVE' | 'FIXED_INCOME' | 'ALL',
                  }))
                }
              >
                <option value="EQUITY">Equity</option>
                <option value="DERIVATIVE">Derivative / Options</option>
                <option value="FIXED_INCOME">Fixed Income</option>
                <option value="ALL">All Asset Classes</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="res-form-jurisdiction" className={styles.fieldLabel}>
                Jurisdiction
              </label>
              <select
                id="res-form-jurisdiction"
                className={styles.select}
                value={form.jurisdiction}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    jurisdiction: e.target.value as 'US' | 'IN' | 'GLOBAL',
                  }))
                }
              >
                <option value="US">United States (US)</option>
                <option value="IN">India (IN)</option>
                <option value="GLOBAL">Global</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="res-form-reasonCategory" className={styles.fieldLabel}>
              Reason Category
            </label>
            <select
              id="res-form-reasonCategory"
              className={styles.select}
              value={form.reasonCategory}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  reasonCategory: e.target.value as RestrictedReasonCategory,
                }))
              }
            >
              {RestrictedReasonCategorySchema.options.map((cat) => (
                <option key={cat} value={cat}>
                  {REASON_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="res-form-policyClause" className={styles.fieldLabel}>
              Policy Clause Reference
            </label>
            <input
              id="res-form-policyClause"
              className={styles.input}
              required
              value={form.policyClause}
              onChange={(e) => setForm((p) => ({ ...p, policyClause: e.target.value }))}
              placeholder="e.g. Global Ethics Policy §4.2"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="res-form-notes" className={styles.fieldLabel}>
              Notes & Compliance Context
            </label>
            <textarea
              id="res-form-notes"
              className={`${styles.input} ${styles.textarea}`}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Describe the mandate, confidential client, or rationale..."
            />
          </div>

          <div className={styles.inline} style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isDisabled={isMutating}>
              {isMutating ? 'Saving...' : 'Add to Restricted List'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
