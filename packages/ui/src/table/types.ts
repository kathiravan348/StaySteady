import type { ReactNode } from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';

// Re-exported so consumers can type columns without depending on TanStack Table directly.
export type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

export type TableDensity = 'compact' | 'comfortable';

declare module '@tanstack/react-table' {
  // Generic column metadata understood by DataTable. The type parameters must match TanStack's
  // declaration for the merge to apply, even though they are unused here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // 'end' right-aligns a column with tabular figures (numbers).
    readonly align?: 'start' | 'end';
    // Plain-text column name for column pickers and exports.
    readonly label?: string;
    // Formats this column's value in the group row when rows are grouped by it.
    readonly formatGroupValue?: (value: unknown) => string;
  }
}

export interface DataTableProps<TData> {
  readonly data: readonly TData[];
  readonly columns: readonly ColumnDef<TData, unknown>[];
  // Stable ids keep selection and expanded details attached to the right rows as data refreshes.
  readonly getRowId?: (row: TData, index: number) => string;
  readonly ariaLabel?: string;
  readonly isVirtual?: boolean;
  readonly virtualHeight?: number;
  readonly density?: TableDensity;
  readonly enableSorting?: boolean;
  readonly enableFiltering?: boolean;
  readonly enablePagination?: boolean;
  readonly pageSize?: number;
  readonly globalFilter?: string;
  readonly onGlobalFilterChange?: (filter: string) => void;
  readonly columnFilters?: ColumnFiltersState;
  readonly onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  readonly columnVisibility?: VisibilityState;
  readonly onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  // Column ids to group rows by, outermost first. Not supported together with isVirtual.
  readonly grouping?: readonly string[];
  readonly enableRowSelection?: boolean;
  readonly rowSelection?: RowSelectionState;
  readonly onRowSelectionChange?: (selection: RowSelectionState) => void;
  readonly stickyFirstColumn?: boolean;
  // Expandable detail content per row. Not supported together with isVirtual.
  readonly renderRowDetails?: (row: TData) => ReactNode;
  readonly onRowClick?: (row: TData) => void;
  readonly emptyState?: ReactNode;
  readonly className?: string;
}
