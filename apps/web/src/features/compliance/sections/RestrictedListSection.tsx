// Restricted instrument list register for S-33 (requirements 27; UI spec 19.1).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Button, Card } from '@staysteady/ui';

import type {
  AddRestrictedInstrumentInput,
  RestrictedInstrument,
} from '../../../data/schemas/compliance';
import { REASON_CATEGORY_LABELS, getReasonBadgeVariant } from '../model/complianceLabels';
import styles from '../Compliance.module.scss';
import { AddRestrictedModal } from './AddRestrictedModal';

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

  const filtered = instruments.filter((item) => {
    const q = filterQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.policyClause.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q)
    );
  });

  return (
    <Card title="Restricted Instruments Register">
      <div className={styles.stack}>
        <div className={styles.inlineBetween}>
          <p className={styles.bannerSubtext}>
            Securities prohibited from all transactions. Refused at signal stage to ensure orders
            never reach a broker.
          </p>
          <Button variant="secondary" size="sm" onPress={() => setIsModalOpen(true)}>
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

        <AddRestrictedModal
          isOpen={isModalOpen}
          isMutating={isMutating}
          onClose={() => setIsModalOpen(false)}
          onAdd={onAdd}
        />
      </div>
    </Card>
  );
};
