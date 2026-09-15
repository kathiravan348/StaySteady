import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

export type TableDensity = 'compact' | 'comfortable';

export interface DataTableProps<TData> {
  readonly data: readonly TData[];
  readonly columns: readonly ColumnDef<TData, unknown>[];
  readonly isVirtual?: boolean;
  readonly virtualHeight?: number;
  readonly density?: TableDensity;
  readonly enableSorting?: boolean;
  readonly enableFiltering?: boolean;
  readonly enablePagination?: boolean;
  readonly pageSize?: number;
  readonly globalFilter?: string;
  readonly onGlobalFilterChange?: (filter: string) => void;
  readonly renderRowDetails?: (row: TData) => ReactNode;
  readonly onRowClick?: (row: TData) => void;
  readonly emptyState?: ReactNode;
  readonly className?: string;
}
