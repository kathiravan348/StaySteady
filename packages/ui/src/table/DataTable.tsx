import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ExpandedState,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef, useState, type ReactElement } from 'react';

import { cx } from '../utils/cx';
import { DataTableHeader } from './DataTableHeader';
import { DataTableRow } from './DataTableRow';
import { createSelectionColumn, SELECTION_COLUMN_ID } from './selectionColumn';
import { TablePagination } from './TablePagination';
import type { DataTableProps } from './types';
import { useControllableState } from './useControllableState';
import styles from './DataTable.module.scss';

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  ariaLabel,
  isVirtual = false,
  virtualHeight = 400,
  density = 'compact',
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  pageSize = 20,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  columnVisibility,
  onColumnVisibilityChange,
  grouping,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  stickyFirstColumn = false,
  renderRowDetails,
  onRowClick,
  getRowClassName,
  emptyState,
  className,
}: DataTableProps<TData>): ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  // Groups start expanded; live data refreshes must not collapse them or reset the page.
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [openDetails, setOpenDetails] = useState<Readonly<Record<string, boolean>>>({});
  const [filterValue, setFilterValue] = useControllableState(
    globalFilter,
    onGlobalFilterChange,
    '',
  );
  const [filters, setFilters] = useControllableState(columnFilters, onColumnFiltersChange, []);
  const [visibility, setVisibility] = useControllableState(
    columnVisibility,
    onColumnVisibilityChange,
    {},
  );
  const [selection, setSelection] = useControllableState(rowSelection, onRowSelectionChange, {});

  const groupingKey = grouping?.join('|') ?? '';
  const groupingState = useMemo(() => (grouping === undefined ? [] : [...grouping]), [groupingKey]);
  const tableData = useMemo(() => [...data], [data]);
  const tableColumns = useMemo(
    () => (enableRowSelection ? [createSelectionColumn<TData>(), ...columns] : [...columns]),
    [columns, enableRowSelection],
  );

  const table = useReactTable<TData>({
    data: tableData,
    columns: tableColumns,
    ...(getRowId === undefined ? {} : { getRowId }),
    // Group rows show a total only where a column defines aggregatedCell; TanStack's default would
    // otherwise print raw sums such as summed percentages.
    defaultColumn: { aggregatedCell: () => null },
    state: {
      sorting,
      expanded,
      globalFilter: filterValue,
      columnFilters: filters,
      columnVisibility: visibility,
      rowSelection: selection,
      grouping: groupingState,
    },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setFilterValue,
    onColumnFiltersChange: setFilters,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelection,
    enableSorting,
    enableFilters: enableFiltering,
    enableRowSelection,
    enableGrouping: groupingState.length > 0,
    autoResetExpanded: false,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...(enablePagination && !isVirtual ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    initialState: { pagination: { pageSize } },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (density === 'compact' ? 32 : 44),
    overscan: 10,
    enabled: isVirtual,
  });

  const details = isVirtual ? undefined : renderRowDetails;
  const visibleColumns = table.getVisibleLeafColumns();
  const stickyColumnId = stickyFirstColumn
    ? visibleColumns.find((column) => column.id !== SELECTION_COLUMN_ID)?.id
    : undefined;
  const columnCount = visibleColumns.length + (details === undefined ? 0 : 1);
  const toggleDetails = (rowId: string): void => {
    setOpenDetails((open) => ({ ...open, [rowId]: open[rowId] !== true }));
  };

  const body =
    rows.length === 0 ? (
      <tr>
        <td colSpan={columnCount} className={styles.emptyCell}>
          {emptyState ?? 'No records found'}
        </td>
      </tr>
    ) : isVirtual ? (
      rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (row === undefined) {
          return null;
        }
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
        <DataTableRow
          key={row.id}
          row={row}
          table={table}
          stickyColumnId={stickyColumnId}
          isDetailsOpen={openDetails[row.id] === true}
          onToggleDetails={toggleDetails}
          renderRowDetails={details}
          onRowClick={onRowClick}
          getRowClassName={getRowClassName}
        />
      ))
    );

  return (
    <div className={cx(styles.tableContainer, styles[density], className)}>
      <div
        ref={scrollRef}
        style={isVirtual ? { maxHeight: `${virtualHeight}px` } : undefined}
        className={cx(isVirtual && styles.virtualScrollContainer)}
      >
        <table className={styles.table} aria-label={ariaLabel}>
          <DataTableHeader
            table={table}
            hasDetails={details !== undefined}
            stickyColumnId={stickyColumnId}
          />
          <tbody
            className={styles.tbody}
            style={
              isVirtual
                ? { height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }
                : undefined
            }
          >
            {body}
          </tbody>
        </table>
      </div>
      {enablePagination && !isVirtual && rows.length > 0 && <TablePagination table={table} />}
    </div>
  );
}
