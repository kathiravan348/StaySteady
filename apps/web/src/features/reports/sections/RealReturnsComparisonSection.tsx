// Nominal vs. Real (CPI-Adjusted) returns & cost drag waterfall (E-06; requirements 30; UI spec 19.2).

import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

export interface DragWaterfallItem {
  readonly id: string;
  readonly label: string;
  readonly percent: string;
  readonly amount: string;
  readonly isDeduction: boolean;
  readonly note: string;
}

const WATERFALL_ITEMS: readonly DragWaterfallItem[] = [
  {
    id: 'gross',
    label: 'Gross Algorithmic Return',
    percent: '+16.8%',
    amount: '+$18,450.00',
    isDeduction: false,
    note: 'Raw trading alpha before transaction friction and statutory costs',
  },
  {
    id: 'commissions',
    label: 'Broker Commissions & Slippage',
    percent: '-0.4%',
    amount: '-$420.00',
    isDeduction: true,
    note: 'Direct execution costs and spread crossing drag',
  },
  {
    id: 'exchange',
    label: 'Exchange, Regulatory & Custody Fees',
    percent: '-0.2%',
    amount: '-$180.00',
    isDeduction: true,
    note: 'SEC/STT transaction charges, depository clearing and stamp duty',
  },
  {
    id: 'taxes',
    label: 'Realized Capital Gains Taxes',
    percent: '-2.0%',
    amount: '-$2,150.00',
    isDeduction: true,
    note: 'Estimated short-term and long-term tax liabilities realized',
  },
  {
    id: 'nominal_net',
    label: 'Net Nominal Return',
    percent: '+14.2%',
    amount: '+$15,700.00',
    isDeduction: false,
    note: 'Actual dollar cash increase credited to accounts',
  },
  {
    id: 'inflation',
    label: 'CPI Inflation Drag (Purchasing Power)',
    percent: '-4.8%',
    amount: '-$5,280.00',
    isDeduction: true,
    note: 'Headline inflation rate erosion on invested capital',
  },
  {
    id: 'real_net',
    label: 'Net Real Return (Purchasing Power)',
    percent: '+9.4%',
    amount: '+$10,420.00',
    isDeduction: false,
    note: 'True wealth accumulation after inflation and all frictional costs',
  },
];

export const RealReturnsComparisonSection: FC = () => {
  return (
    <Card
      title="Real Returns & Performance Drag Breakdown (Requirements 30)"
      extra={<Badge variant="positive">Net Real Return: +9.4%</Badge>}
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Standard performance figures show nominal growth. True wealth preservation requires
          measuring net returns after deducting execution friction, regulatory fees, realized taxes,
          and CPI inflation.
        </p>

        {/* Top Comparison Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-1)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Nominal Return
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--change-profit)',
              }}
            >
              +14.2%
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              +$15,700.00 nominal gain
            </span>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-1)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Benchmark CPI Inflation
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
              }}
            >
              4.8%
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Annualized purchasing power drag
            </span>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-1)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Real Return (CPI-Adjusted)
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--change-profit)',
              }}
            >
              +9.4%
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              +$10,420.00 net real expansion
            </span>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-1)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Real Benchmark Alpha
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--interactive-primary)',
              }}
            >
              +2.1%
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              vs. SPY (+7.3% real return)
            </span>
          </div>
        </div>

        {/* Waterfall Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: 'var(--border-width-thin) solid var(--border-subtle)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: 'var(--space-2)' }}>Component</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Rate / Return</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: 'var(--space-2)' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {WATERFALL_ITEMS.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: 'var(--border-width-thin) solid var(--border-subtle)',
                    backgroundColor:
                      item.id === 'real_net'
                        ? 'var(--surface-raised)'
                        : item.id === 'nominal_net'
                          ? 'var(--surface-raised)'
                          : 'transparent',
                    fontWeight:
                      item.id === 'real_net' || item.id === 'nominal_net' || item.id === 'gross'
                        ? 'var(--font-weight-semibold)'
                        : 'normal',
                  }}
                >
                  <td style={{ padding: 'var(--space-2)' }}>
                    {item.isDeduction && '↳ '}
                    {item.label}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-2)',
                      textAlign: 'right',
                      color: item.isDeduction
                        ? 'var(--change-loss)'
                        : item.id === 'real_net' || item.id === 'nominal_net'
                          ? 'var(--change-profit)'
                          : 'inherit',
                    }}
                  >
                    {item.percent}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-2)',
                      textAlign: 'right',
                      color: item.isDeduction ? 'var(--change-loss)' : 'inherit',
                    }}
                  >
                    {item.amount}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-2)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {item.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};
