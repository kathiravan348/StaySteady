import { flexRender, type Table } from '@tanstack/react-table';
import type { ReactElement } from 'react';

import { cx } from '../utils/cx';
import styles from './DataTable.module.scss';

export interface DataTableHeaderProps<TData> {
  readonly table: Table<TData>;
  readonly hasDetails: boolean;
  readonly stickyColumnId: string | undefined;
}

// Sortable headers are buttons, so sorting works from the keyboard; aria-sort reports the order.
export function DataTableHeader<TData>({
  table,
  hasDetails,
  stickyColumnId,
}: DataTableHeaderProps<TData>): ReactElement {
  return (
    <thead className={styles.thead}>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {hasDetails && (
            <th scope="col" className={cx(styles.th, styles.controlCell)}>
              <span className={styles.visuallyHidden}>Row details</span>
            </th>
          )}
          {headerGroup.headers.map((header) => {
            const { column } = header;
            const canSort = column.getCanSort();
            const direction = column.getIsSorted();
            const ariaSort =
              direction === 'asc'
                ? 'ascending'
                : direction === 'desc'
                  ? 'descending'
                  : canSort
                    ? 'none'
                    : undefined;
            const content = header.isPlaceholder
              ? null
              : flexRender(column.columnDef.header, header.getContext());

            return (
              <th
                key={header.id}
                scope="col"
                aria-sort={ariaSort}
                className={cx(
                  styles.th,
                  column.columnDef.meta?.align === 'end' && styles.numeric,
                  column.id === stickyColumnId && styles.stickyCell,
                )}
              >
                {canSort ? (
                  <button
                    type="button"
                    className={styles.headerButton}
                    onClick={column.getToggleSortingHandler()}
                    title="Sort. Shift-click to sort by several columns."
                  >
                    {content}
                    <span aria-hidden="true">
                      {direction === 'asc' ? ' ▲' : direction === 'desc' ? ' ▼' : ''}
                    </span>
                  </button>
                ) : (
                  content
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
