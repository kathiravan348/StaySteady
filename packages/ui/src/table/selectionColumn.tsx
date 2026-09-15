import type { ColumnDef } from '@tanstack/react-table';

import styles from './DataTable.module.scss';

export const SELECTION_COLUMN_ID = '__select';

// Checkbox column for row selection. Group rows have no checkbox of their own.
export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: SELECTION_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    enableGrouping: false,
    header: ({ table }) => (
      <input
        type="checkbox"
        className={styles.checkbox}
        aria-label="Select all rows"
        checked={table.getIsAllRowsSelected()}
        ref={(input) => {
          if (input !== null) {
            input.indeterminate = table.getIsSomeRowsSelected();
          }
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) =>
      row.getIsGrouped() ? null : (
        <input
          type="checkbox"
          className={styles.checkbox}
          aria-label={`Select row ${row.index + 1}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
  };
}
