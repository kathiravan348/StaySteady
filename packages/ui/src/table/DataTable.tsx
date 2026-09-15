import { useMemo, useRef, useState, type ReactElement } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cx } from '../utils/cx';
import { TablePagination } from './TablePagination';
import type { DataTableProps } from './types';
import styles from './DataTable.module.scss';

export function DataTable<TData>({
  data,
  columns,
  isVirtual = false,
  virtualHeight = 400,
  density = 'compact',
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  pageSize = 20,
  globalFilter,
  onGlobalFilterChange,
  renderRowDetails,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<TData>): ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const tableData = useMemo(() => [...data], [data]);
  const tableColumns = useMemo(() => [...columns], [columns]);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
      ...(globalFilter !== undefined && { globalFilter }),
    },
    onSortingChange: setSorting,
    ...(onGlobalFilterChange && {
      onGlobalFilterChange: (updater: unknown) =>
        onGlobalFilterChange(
          typeof updater === 'function'
            ? (updater as (prev: string) => string)(globalFilter ?? '')
            : String(updater ?? ''),
        ),
    }),
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enableFiltering && { getFilteredRowModel: getFilteredRowModel() }),
    ...(enablePagination && !isVirtual && { getPaginationRowModel: getPaginationRowModel() }),
    initialState: {
      pagination: { pageSize },
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (density === 'compact' ? 32 : 44),
    overscan: 10,
    enabled: isVirtual,
  });

  const toggleRow = (id: string): void => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={cx(styles.tableContainer, styles[density], className)}>
      <div
        ref={parentRef}
        style={isVirtual ? { maxHeight: `${virtualHeight}px` } : undefined}
        className={cx(isVirtual && styles.virtualScrollContainer)}
      >
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {renderRowDetails && <th className={styles.th} style={{ width: 32 }} />}
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cx(styles.th, isSortable && styles.sortable)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDir === 'asc' ? ' ▲' : sortDir === 'desc' ? ' ▼' : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            className={styles.tbody}
            style={
              isVirtual
                ? { height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }
                : undefined
            }
          >
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderRowDetails ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '2rem' }}
                >
                  {emptyState ?? 'No records found'}
                </td>
              </tr>
            ) : isVirtual ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cx(styles.tr, Boolean(onRowClick) && styles.interactive)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderRowDetails && (
                      <td className={styles.td}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(row.id);
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          {expandedRows[row.id] ? '▼' : '►'}
                        </button>
                      </td>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={styles.td}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cx(styles.tr, Boolean(onRowClick) && styles.interactive)}
                >
                  {renderRowDetails && (
                    <td className={styles.td}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(row.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {expandedRows[row.id] ? '▼' : '►'}
                      </button>
                    </td>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {enablePagination && !isVirtual && rows.length > 0 && <TablePagination table={table} />}
    </div>
  );
}
