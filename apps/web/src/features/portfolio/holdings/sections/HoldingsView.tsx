import { Badge } from '@staysteady/ui';
import type { RowSelectionState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';
import { PriceFreshnessBar } from '../../../../shared/ui/PriceFreshnessBar';
import styles from '../HoldingsPage.module.scss';
import { matchesHoldingSearch } from '../model/holdingRows';
import {
  DEFAULT_COLUMN_VISIBILITY,
  FORCED_HIDDEN_COLUMNS,
  HOLDING_COLUMN_OPTIONS,
  toCsv,
} from '../model/holdingsExport';
import type { HoldingRow } from '../model/holdingTypes';
import { useHoldingsLayout } from '../useHoldingsLayout';
import { HoldingsTable } from './HoldingsTable';
import { HoldingsToolbar } from './HoldingsToolbar';

export interface HoldingsViewProps {
  readonly rows: readonly HoldingRow[];
  readonly baseCurrency: BaseCurrencyCode;
  readonly heldMarketIds: ReadonlySet<string>;
  readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
  readonly warnings: readonly string[];
}

function downloadText(fileName: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function HoldingsView({
  rows,
  baseCurrency,
  heldMarketIds,
  oldestQuoteTimestamp,
  warnings,
}: HoldingsViewProps): ReactElement {
  const layout = useHoldingsLayout(DEFAULT_COLUMN_VISIBILITY);
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<RowSelectionState>({});
  const visibility = useMemo(
    () => ({ ...layout.columnVisibility, ...FORCED_HIDDEN_COLUMNS }),
    [layout.columnVisibility],
  );
  const selectedRows = rows.filter((row) => selection[row.id] === true);

  // Exports the selected rows, or every row matching the search when nothing is selected.
  const exportView = (): void => {
    const source =
      selectedRows.length > 0
        ? selectedRows
        : rows.filter((row) => matchesHoldingSearch(row, search));
    const columns = HOLDING_COLUMN_OPTIONS.filter((option) => visibility[option.id] !== false);
    const date = new Date().toISOString().slice(0, 10);
    downloadText(`holdings-${date}.csv`, toCsv(source, columns), 'text/csv');
  };

  return (
    <div className={styles.layout}>
      <PriceFreshnessBar
        oldestQuoteTimestamp={oldestQuoteTimestamp}
        heldMarketIds={heldMarketIds}
      />
      {warnings.length > 0 && (
        <div className={styles.warnings}>
          {warnings.map((warning) => (
            <Badge key={warning} variant="warning">
              {warning}
            </Badge>
          ))}
        </div>
      )}
      <HoldingsToolbar
        search={search}
        onSearchChange={setSearch}
        grouping={layout.grouping}
        onGroupingChange={layout.setGrouping}
        columnOptions={HOLDING_COLUMN_OPTIONS}
        columnVisibility={visibility}
        onColumnVisibilityChange={layout.setColumnVisibility}
        selectedCount={selectedRows.length}
        onExport={exportView}
        onResetLayout={layout.resetLayout}
      />
      <HoldingsTable
        rows={rows}
        baseCurrency={baseCurrency}
        grouping={layout.grouping}
        columnVisibility={visibility}
        onColumnVisibilityChange={layout.setColumnVisibility}
        search={search}
        onSearchChange={setSearch}
        selection={selection}
        onSelectionChange={setSelection}
      />
    </div>
  );
}
