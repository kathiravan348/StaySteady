import { DataTable, NoResultsState } from '@staysteady/ui';
import type { RowSelectionState, VisibilityState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import { createHoldingColumns } from '../columns/holdingColumns';
import type { HoldingRow } from '../model/holdingTypes';
import type { HoldingGrouping } from '../useHoldingsLayout';
import { HoldingDetails } from './HoldingDetails';

export interface HoldingsTableProps {
  readonly rows: readonly HoldingRow[];
  readonly baseCurrency: BaseCurrencyCode;
  readonly grouping: HoldingGrouping;
  readonly columnVisibility: VisibilityState;
  readonly onColumnVisibilityChange: (visibility: VisibilityState) => void;
  readonly search: string;
  readonly onSearchChange: (search: string) => void;
  readonly selection: RowSelectionState;
  readonly onSelectionChange: (selection: RowSelectionState) => void;
}

const GROUPING_COLUMNS: Readonly<Record<HoldingGrouping, readonly string[]>> = {
  flat: [],
  country: ['country'],
  currency: ['currency'],
  type: ['type'],
  sector: ['sector'],
  industry: ['industry'],
  group: ['group'],
  broker: ['broker'],
  strategy: ['strategy'],
};

const getRowId = (row: HoldingRow): string => row.id;
const renderDetails = (row: HoldingRow): ReactElement => <HoldingDetails row={row} />;

export function HoldingsTable({
  rows,
  baseCurrency,
  grouping,
  columnVisibility,
  onColumnVisibilityChange,
  search,
  onSearchChange,
  selection,
  onSelectionChange,
}: HoldingsTableProps): ReactElement {
  const columns = useMemo(() => createHoldingColumns(baseCurrency), [baseCurrency]);

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={getRowId}
      ariaLabel="Holdings"
      grouping={GROUPING_COLUMNS[grouping]}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      globalFilter={search}
      onGlobalFilterChange={onSearchChange}
      enableRowSelection
      rowSelection={selection}
      onRowSelectionChange={onSelectionChange}
      enablePagination={false}
      stickyFirstColumn
      renderRowDetails={renderDetails}
      emptyState={
        <NoResultsState
          title="No holdings match"
          description="No holding matches your search."
          clearLabel="Clear search"
          onClearFilters={() => {
            onSearchChange('');
          }}
        />
      }
    />
  );
}
