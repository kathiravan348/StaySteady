import type { ReactElement } from 'react';
import type { Table } from '@tanstack/react-table';

export interface TablePaginationProps<TData> {
  readonly table: Table<TData>;
}

export function TablePagination<TData>({ table }: TablePaginationProps<TData>): ReactElement {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        borderTop: '1px solid var(--border-subtle, #334155)',
        fontSize: '0.875rem',
        color: 'var(--text-secondary, #94a3b8)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Rows per page:</span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={{
            background: 'var(--surface-raised, #1e293b)',
            color: 'var(--text-primary, #f8fafc)',
            border: '1px solid var(--border-subtle, #334155)',
            borderRadius: '0.25rem',
            padding: '0.125rem 0.375rem',
          }}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span>
          Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          style={{
            background: 'var(--surface-raised, #1e293b)',
            color: 'var(--text-primary, #f8fafc)',
            border: '1px solid var(--border-subtle, #334155)',
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem',
            cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed',
            opacity: table.getCanPreviousPage() ? 1 : 0.5,
          }}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          style={{
            background: 'var(--surface-raised, #1e293b)',
            color: 'var(--text-primary, #f8fafc)',
            border: '1px solid var(--border-subtle, #334155)',
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem',
            cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed',
            opacity: table.getCanNextPage() ? 1 : 0.5,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
