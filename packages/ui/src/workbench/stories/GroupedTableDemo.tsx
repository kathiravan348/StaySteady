import type { ColumnDef, RowSelectionState, VisibilityState } from '@tanstack/react-table';
import { useState, type ReactElement } from 'react';

import { DataTable } from '../../table/DataTable';

interface SampleAsset {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly sector: string;
  readonly value: number;
  readonly changePercent: number;
}

const ASSETS: readonly SampleAsset[] = [
  {
    id: 'a1',
    name: 'Alpha Corp',
    region: 'Americas',
    sector: 'Technology',
    value: 42000,
    changePercent: 1.2,
  },
  {
    id: 'a2',
    name: 'Beta Energy',
    region: 'Americas',
    sector: 'Energy',
    value: 18500,
    changePercent: -0.8,
  },
  {
    id: 'a3',
    name: 'Gamma Bank',
    region: 'Europe',
    sector: 'Financials',
    value: 23100,
    changePercent: 0.4,
  },
  {
    id: 'a4',
    name: 'Delta Motors',
    region: 'Asia',
    sector: 'Industrials',
    value: 9800,
    changePercent: -2.1,
  },
  {
    id: 'a5',
    name: 'Epsilon Soft',
    region: 'Asia',
    sector: 'Technology',
    value: 31250,
    changePercent: 3.4,
  },
  {
    id: 'a6',
    name: 'Zeta Health',
    region: 'Europe',
    sector: 'Healthcare',
    value: 15700,
    changePercent: 0,
  },
];

const sumValue = (rows: readonly { readonly original: SampleAsset }[]): string =>
  rows.reduce((total, row) => total + row.original.value, 0).toLocaleString('en-US');

const COLUMNS: readonly ColumnDef<SampleAsset, unknown>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name', meta: { label: 'Name' } },
  { id: 'region', accessorKey: 'region', header: 'Region', meta: { label: 'Region' } },
  { id: 'sector', accessorKey: 'sector', header: 'Sector', meta: { label: 'Sector' } },
  {
    id: 'value',
    accessorKey: 'value',
    header: 'Value',
    meta: { align: 'end', label: 'Value' },
    cell: (info) => Number(info.getValue()).toLocaleString('en-US'),
    aggregatedCell: ({ row }) => sumValue(row.getLeafRows()),
  },
  {
    id: 'changePercent',
    accessorKey: 'changePercent',
    header: 'Change',
    meta: { align: 'end', label: 'Change' },
    cell: (info) => `${Number(info.getValue()).toFixed(2)}%`,
  },
];

const GROUPINGS: readonly (readonly string[])[] = [
  [],
  ['region'],
  ['sector'],
  ['region', 'sector'],
];

// Demonstrates grouping with totals, column visibility, row selection and expandable details.
export function GroupedTableDemo(): ReactElement {
  const [grouping, setGrouping] = useState<readonly string[]>([]);
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const [selection, setSelection] = useState<RowSelectionState>({});
  const selectedCount = Object.values(selection).filter(Boolean).length;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {GROUPINGS.map((option) => (
          <button
            key={option.join('+') || 'flat'}
            type="button"
            aria-pressed={grouping.join('|') === option.join('|')}
            onClick={() => {
              setGrouping(option);
            }}
          >
            {option.length === 0 ? 'Flat' : `Group: ${option.join(' › ')}`}
          </button>
        ))}
        <label>
          <input
            type="checkbox"
            checked={visibility['sector'] !== false}
            onChange={(event) => {
              setVisibility((current) => ({ ...current, sector: event.target.checked }));
            }}
          />{' '}
          Show sector
        </label>
        <span>{selectedCount} selected</span>
      </div>
      <DataTable
        data={ASSETS}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        ariaLabel="Sample assets"
        grouping={grouping}
        columnVisibility={visibility}
        onColumnVisibilityChange={setVisibility}
        enableRowSelection
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        enablePagination={false}
        stickyFirstColumn
        renderRowDetails={(row) => <div>{row.name}: expanded detail content.</div>}
      />
    </div>
  );
}
