import type { VisibilityState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { humanizeToken } from '../../../../shared/format';
import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import styles from '../HoldingsPage.module.scss';
import type { HoldingColumnOption } from '../model/holdingsExport';
import type { HoldingGrouping } from '../useHoldingsLayout';
import { HOLDING_GROUPINGS } from '../useHoldingsLayout';
import { ColumnPicker } from './ColumnPicker';

export interface HoldingsToolbarProps {
  readonly search: string;
  readonly onSearchChange: (search: string) => void;
  readonly grouping: HoldingGrouping;
  readonly onGroupingChange: (grouping: HoldingGrouping) => void;
  readonly columnOptions: readonly HoldingColumnOption[];
  readonly columnVisibility: VisibilityState;
  readonly onColumnVisibilityChange: (visibility: VisibilityState) => void;
  readonly selectedCount: number;
  readonly onExport: () => void;
  readonly onResetLayout: () => void;
}

const groupingLabel = (grouping: HoldingGrouping): string =>
  grouping === 'flat' ? 'No grouping' : humanizeToken(grouping);

export function HoldingsToolbar({
  search,
  onSearchChange,
  grouping,
  onGroupingChange,
  columnOptions,
  columnVisibility,
  onColumnVisibilityChange,
  selectedCount,
  onExport,
  onResetLayout,
}: HoldingsToolbarProps): ReactElement {
  return (
    <div className={styles.toolbar}>
      <label>
        <span className={styles.visuallyHidden}>Search holdings</span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search symbol, name, market, broker"
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
        />
      </label>
      <ToggleGroup
        label="Group holdings by"
        options={HOLDING_GROUPINGS}
        value={grouping}
        onChange={onGroupingChange}
        formatOption={groupingLabel}
      />
      <ColumnPicker
        options={columnOptions}
        visibility={columnVisibility}
        onChange={onColumnVisibilityChange}
      />
      <button type="button" className={styles.toolbarButton} onClick={onExport}>
        {selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export view'}
      </button>
      <button type="button" className={styles.toolbarButton} onClick={onResetLayout}>
        Reset layout
      </button>
    </div>
  );
}
