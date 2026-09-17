// Restricted instrument list register for S-33 (requirements 27; UI spec 19.1).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Button, Card } from '@staysteady/ui';

import type {
  AddRestrictedInstrumentInput,
  RestrictedInstrument,
  RestrictedReasonCategory,
} from '../../../data/schemas/compliance';
import {
  AddRestrictedInstrumentInputSchema,
  RestrictedReasonCategorySchema,
} from '../../../data/schemas/compliance';
import { REASON_CATEGORY_LABELS, getReasonBadgeVariant } from '../model/complianceLabels';
import styles from '../Compliance.module.scss';

export interface RestrictedListSectionProps {
  readonly instruments: readonly RestrictedInstrument[];
  readonly onAdd: (input: AddRestrictedInstrumentInput) => Promise<void>;
  readonly onRemove: (id: string) => Promise<void>;
  readonly isMutating: boolean;
}

export const RestrictedListSection: FC<RestrictedListSectionProps> = ({
  instruments,
  onAdd,
  onRemove,
  isMutating,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Form state
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState<'EQUITY' | 'DERIVATIVE' | 'FIXED_INCOME' | 'ALL'>(
    'EQUITY',
  );
  const [jurisdiction, setJurisdiction] = useState<'US' | 'IN' | 'GLOBAL'>('US');
  const [reasonCategory, setReasonCategory] = useState<RestrictedReasonCategory>('EMPLOYER_EQUITY');
  const [policyClause, setPolicyClause] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = instruments.filter((item) => {
    const q = filterQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.policyClause.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q)
    );
  });

  const handleOpenModal = () => {
    setSymbol('');
    setName('');
    setPolicyClause('Staff Personal Dealing Rules §2.1');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = AddRestrictedInstrumentInputSchema.safeParse({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      assetClass,
      jurisdiction,
      reasonCategory,
      policyClause: policyClause.trim(),
      notes: notes.trim(),
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    try {
      await onAdd(parsed.data);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add restricted instrument');
    }
  };

  return (
    <Card title="Restricted Instruments Register">
      <div className={styles.stack}>
        <div className={styles.inlineBetween}>
          <p className={styles.bannerSubtext}>
            Securities prohibited from all transactions. Refused at signal stage to ensure orders
            never reach a broker.
          </p>
          <Button variant="secondary" size="sm" onPress={handleOpenModal}>
            + Add Restricted Instrument
          </Button>
        </div>

        <div className={styles.inline}>
          <input
            className={styles.input}
            type="search"
            placeholder="Filter by symbol, name, or policy clause..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ width: '100%', maxWidth: '24rem' }}
          />
        </div>

        {filtered.length === 0 ? (
          <p className={styles.bannerSubtext}>
            No restricted instruments match the current filter.
          </p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.inlineBetween}>
                  <div className={styles.inline}>
                    <span className={styles.bannerText}>
                      {item.symbol} — {item.name}
                    </span>
                    <Badge variant={getReasonBadgeVariant(item.reasonCategory)}>
                      {REASON_CATEGORY_LABELS[item.reasonCategory]}
                    </Badge>
                    <Badge variant="neutral">{item.jurisdiction}</Badge>
                    <Badge variant="neutral">{item.assetClass}</Badge>
                    {item.isReviewOverdue && <Badge variant="warning">Annual Review Overdue</Badge>}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onPress={() => void onRemove(item.id)}
                    isDisabled={isMutating}
                  >
                    Remove
                  </Button>
                </div>

                <div className={styles.inlineBetween}>
                  <span className={styles.bannerSubtext}>
                    Clause: <strong>{item.policyClause}</strong> | Effective:{' '}
                    {item.effectiveFrom.slice(0, 10)} | Due: {item.reviewDueDate.slice(0, 10)}
                  </span>
                  <span className={styles.fieldLabel}>Added by: {item.addedBy}</span>
                </div>

                {item.notes && <p className={styles.bannerSubtext}>{item.notes}</p>}
              </li>
            ))}
          </ul>
        )}

        {isModalOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <div className={styles.inlineBetween}>
                <h3 className={styles.bannerText}>Add Restricted Instrument</h3>
                <Button variant="ghost" size="sm" onPress={() => setIsModalOpen(false)}>
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
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      value={assetClass}
                      onChange={(e) =>
                        setAssetClass(
                          e.target.value as 'EQUITY' | 'DERIVATIVE' | 'FIXED_INCOME' | 'ALL',
                        )
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
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value as 'US' | 'IN' | 'GLOBAL')}
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
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value as RestrictedReasonCategory)}
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
                    value={policyClause}
                    onChange={(e) => setPolicyClause(e.target.value)}
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe the mandate, confidential client, or rationale..."
                  />
                </div>

                <div className={styles.inline} style={{ justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onPress={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isDisabled={isMutating}>
                    {isMutating ? 'Saving...' : 'Add to Restricted List'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
