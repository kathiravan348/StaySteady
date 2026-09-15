import { flexRender, type Row, type Table } from '@tanstack/react-table';
import type { ReactElement, ReactNode } from 'react';

import { cx } from '../utils/cx';
import { SELECTION_COLUMN_ID } from './selectionColumn';
import styles from './DataTable.module.scss';

export interface DataTableRowProps<TData> {
  readonly row: Row<TData>;
  readonly table: Table<TData>;
  readonly stickyColumnId: string | undefined;
  readonly isDetailsOpen: boolean;
  readonly onToggleDetails: (rowId: string) => void;
  readonly renderRowDetails: ((row: TData) => ReactNode) | undefined;
  readonly onRowClick: ((row: TData) => void) | undefined;
}

function groupLabel<TData>(row: Row<TData>, table: Table<TData>): string {
  const columnId = row.groupingColumnId;
  const format =
    columnId === undefined
      ? undefined
      : table.getColumn(columnId)?.columnDef.meta?.formatGroupValue;
  return format === undefined ? String(row.groupingValue) : format(row.groupingValue);
}

// One data row, or a group row with a toggle, leaf count and each column's aggregated cell.
export function DataTableRow<TData>({
  row,
  table,
  stickyColumnId,
  isDetailsOpen,
  onToggleDetails,
  renderRowDetails,
  onRowClick,
}: DataTableRowProps<TData>): ReactElement {
  const cells = row.getVisibleCells();
  const hasDetails = renderRowDetails !== undefined;
  const cellClass = (columnId: string): string =>
    cx(
      styles.td,
      table.getColumn(columnId)?.columnDef.meta?.align === 'end' && styles.numeric,
      columnId === stickyColumnId && styles.stickyCell,
    );

  if (row.getIsGrouped()) {
    const labelIndex = cells.findIndex((cell) => cell.column.id !== SELECTION_COLUMN_ID);
    return (
      <tr className={cx(styles.tr, styles.groupRow)}>
        {hasDetails && <td className={cx(styles.td, styles.controlCell)} />}
        {cells.map((cell, index) => (
          <td key={cell.id} className={cellClass(cell.column.id)}>
            {index === labelIndex ? (
              <button
                type="button"
                className={styles.groupToggle}
                style={{ paddingInlineStart: `calc(var(--space-4, 1rem) * ${row.depth})` }}
                aria-expanded={row.getIsExpanded()}
                onClick={row.getToggleExpandedHandler()}
              >
                <span aria-hidden="true">{row.getIsExpanded() ? '▼' : '►'}</span>
                {groupLabel(row, table)}
                <span className={styles.groupCount}>({row.getLeafRows().length})</span>
              </button>
            ) : cell.column.columnDef.aggregatedCell === undefined ? null : (
              flexRender(cell.column.columnDef.aggregatedCell, cell.getContext())
            )}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <>
      <tr
        className={cx(
          styles.tr,
          onRowClick !== undefined && styles.interactive,
          row.getIsSelected() && styles.selected,
        )}
        onClick={
          onRowClick === undefined
            ? undefined
            : () => {
                onRowClick(row.original);
              }
        }
      >
        {hasDetails && (
          <td className={cx(styles.td, styles.controlCell)}>
            <button
              type="button"
              className={styles.expandButton}
              aria-expanded={isDetailsOpen}
              aria-label={isDetailsOpen ? 'Hide row details' : 'Show row details'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleDetails(row.id);
              }}
            >
              <span aria-hidden="true">{isDetailsOpen ? '▼' : '►'}</span>
            </button>
          </td>
        )}
        {cells.map((cell) => (
          <td key={cell.id} className={cellClass(cell.column.id)}>
            {cell.getIsPlaceholder()
              ? null
              : flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {renderRowDetails !== undefined && isDetailsOpen && (
        <tr className={styles.detailsRow}>
          <td className={styles.detailsCell} colSpan={cells.length + 1}>
            {renderRowDetails(row.original)}
          </td>
        </tr>
      )}
    </>
  );
}
