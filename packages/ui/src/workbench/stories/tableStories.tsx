import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../primitives/Badge/Badge';
import { DataTable } from '../../table/DataTable';
import type { ComponentStory } from '../types';
import { GroupedTableDemo } from './GroupedTableDemo';

interface SampleHolding {
  readonly symbol: string;
  readonly name: string;
  readonly shares: number;
  readonly price: number;
  readonly value: number;
  readonly gainPercent: number;
}

const SAMPLE_DATA: readonly SampleHolding[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 120,
    price: 182.5,
    value: 21900,
    gainPercent: 14.8,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 80,
    price: 412.0,
    value: 32960,
    gainPercent: 22.4,
  },
  { symbol: 'TSLA', name: 'Tesla Inc.', shares: 95, price: 238.4, value: 22648, gainPercent: -4.2 },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    shares: 45,
    price: 118.2,
    value: 5319,
    gainPercent: 48.6,
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    shares: 500,
    price: 2890,
    value: 1445000,
    gainPercent: 6.2,
  },
];

const COLUMNS: readonly ColumnDef<SampleHolding, unknown>[] = [
  { accessorKey: 'symbol', header: 'Symbol' },
  { accessorKey: 'name', header: 'Company Name' },
  {
    accessorKey: 'shares',
    header: 'Quantity',
    cell: (info) => (
      <span style={{ fontFamily: 'var(--font-mono)' }}>{String(info.getValue())}</span>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Last Price',
    cell: (info) => (
      <span style={{ fontFamily: 'var(--font-mono)' }}>${Number(info.getValue()).toFixed(2)}</span>
    ),
  },
  {
    accessorKey: 'value',
    header: 'Total Value',
    cell: (info) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        ${Number(info.getValue()).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'gainPercent',
    header: 'Unrealized P&L',
    cell: (info) => {
      const val = Number(info.getValue());
      return (
        <Badge variant={val >= 0 ? 'positive' : 'negative'}>
          {val >= 0 ? `+${val}%` : `${val}%`}
        </Badge>
      );
    },
  },
];

export const tableStories: readonly ComponentStory[] = [
  {
    id: 'data-table',
    name: 'DataTable',
    category: 'Data Table',
    description:
      'Dense financial grid supporting multi-column sorting, row expansion, pagination, and virtualization.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <DataTable
          data={SAMPLE_DATA}
          columns={COLUMNS}
          enableSorting
          enablePagination
          pageSize={5}
          renderRowDetails={() => (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Tax Lots: 2 active lots acquired on 2023-04-12 and 2024-01-18. Broker: Interactive
              Brokers.
            </div>
          )}
        />
      </div>
    ),
  },
  {
    id: 'data-table-grouped',
    name: 'DataTable — grouping, selection and details',
    category: 'Data Table',
    description:
      'Multi-level grouping with totals rows, column visibility, checkbox row selection, sticky first column and expandable row details.',
    render: () => <GroupedTableDemo />,
  },
];
