import { Button, NoResultsState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { StrategyLibraryEntryDto } from '../../../../data/schemas';
import { CreateStrategyDialog } from '../../strategyCreate/CreateStrategyDialog';
import type { LibraryFilters } from '../model/libraryFilters';
import { DEFAULT_FILTERS, applyFilters, filterOptions, isFiltered } from '../model/libraryFilters';
import { useStrategyPromotions } from '../useStrategyPromotions';
import { LibraryFilterBar } from './LibraryFilterBar';
import { PromotionDialog } from './PromotionDialog';
import { StrategyCard } from './StrategyCard';
import { StrategyRetirementSection } from './StrategyRetirementSection';
import styles from '../StrategyLibrary.module.scss';

export interface LibraryViewProps {
  readonly entries: readonly StrategyLibraryEntryDto[];
}

export function LibraryView({ entries }: LibraryViewProps): ReactElement {
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<StrategyLibraryEntryDto | null>(null);
  const promotions = useStrategyPromotions();

  const visible = applyFilters(entries, filters);
  const options = filterOptions(entries);
  const promotingEntry = entries.find((entry) => String(entry.strategyId) === promoting);

  return (
    <div className={styles.page}>
      <LibraryFilterBar
        filters={filters}
        options={options}
        shown={visible.length}
        total={entries.length}
        onChange={setFilters}
      />

      {visible.length === 0 ? (
        <NoResultsState
          title="No strategies match these filters"
          description="Every strategy is filtered out. Clear the filters to see the full library."
          action={
            isFiltered(filters) ? (
              <Button
                variant="secondary"
                onPress={() => {
                  setFilters(DEFAULT_FILTERS);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.cardGrid}>
          {visible.map((entry) => {
            const id = String(entry.strategyId);
            return (
              <StrategyCard
                key={id}
                entry={entry}
                request={promotions.requests[id]}
                onPromote={() => {
                  setPromoting(id);
                }}
                onWithdraw={() => {
                  promotions.withdraw(id);
                }}
                onDuplicate={() => {
                  setDuplicating(entry);
                }}
              />
            );
          })}
        </div>
      )}

      <StrategyRetirementSection />

      {duplicating !== null && (
        <CreateStrategyDialog
          duplicateOf={{ id: String(duplicating.strategyId), name: duplicating.name }}
          onClose={() => {
            setDuplicating(null);
          }}
        />
      )}

      {promotingEntry !== undefined && (
        <PromotionDialog
          entry={promotingEntry}
          onClose={() => {
            setPromoting(null);
          }}
          onConfirm={(stage) => {
            promotions.request(String(promotingEntry.strategyId), stage);
            setPromoting(null);
          }}
        />
      )}
    </div>
  );
}
