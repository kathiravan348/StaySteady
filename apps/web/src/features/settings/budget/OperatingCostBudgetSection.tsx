// Monthly algorithmic operating cost budget & drag tracker (E-09; requirements 34; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

interface BudgetItem {
  readonly id: string;
  readonly category: string;
  readonly provider: string;
  readonly amount: number;
  readonly cycle: 'Monthly' | 'Annual';
  readonly essential: boolean;
}

const DEFAULT_ITEMS: readonly BudgetItem[] = [
  {
    id: 'b-1',
    category: 'Market Data',
    provider: 'IBKR US Securities Snapshot & Futures L2',
    amount: 65,
    cycle: 'Monthly',
    essential: true,
  },
  {
    id: 'b-2',
    category: 'Broker Connectivity',
    provider: 'Alpaca / Zerodha Kite Connect API Gateway',
    amount: 25,
    cycle: 'Monthly',
    essential: true,
  },
  {
    id: 'b-3',
    category: 'Infrastructure',
    provider: 'Hetzner Dedicated VPS (Frankfurt Algo Node)',
    amount: 20,
    cycle: 'Monthly',
    essential: true,
  },
  {
    id: 'b-4',
    category: 'Data Feeds',
    provider: 'Corporate Action & Economic Calendar Feed',
    amount: 15,
    cycle: 'Monthly',
    essential: false,
  },
];

export const OperatingCostBudgetSection: FC = () => {
  const [budgetCap, setBudgetCap] = useState(150);
  const items = DEFAULT_ITEMS;

  const totalMonthlyAccrued = items.reduce((sum, item) => sum + item.amount, 0);
  const percentUsed = ((totalMonthlyAccrued / budgetCap) * 100).toFixed(1);
  const remainingBudget = budgetCap - totalMonthlyAccrued;
  const aumAnnualDrag = (((totalMonthlyAccrued * 12) / 321900) * 100).toFixed(2);

  return (
    <Card
      title="Algorithmic Operating Cost Budget & Drag (Requirements 34)"
      extra={
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Badge variant={Number(percentUsed) > 90 ? 'warning' : 'positive'}>
            ${totalMonthlyAccrued} / ${budgetCap} ({percentUsed}% of Cap)
          </Badge>
          <Badge variant="neutral">Drag: {aumAnnualDrag}% of AUM</Badge>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Tracks third-party algorithmic infrastructure costs (broker API fees, L2 market data,
          cloud servers, and data feeds) to prevent operational cost leakage from degrading net
          trading returns.
        </p>

        {/* Top Summary Stats */}
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
              Accrued Operating Costs
            </span>
            <span
              style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
            >
              ${totalMonthlyAccrued.toFixed(2)} / mo
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              ${(totalMonthlyAccrued * 12).toFixed(2)} annualized run-rate
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
              Budget Remaining
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: remainingBudget >= 0 ? 'var(--change-profit)' : 'var(--change-loss)',
              }}
            >
              ${remainingBudget.toFixed(2)} / mo
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              {remainingBudget >= 0 ? 'Within budget limit' : 'Budget exceeded'}
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
              Net AUM Drag Efficiency
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--interactive-primary)',
              }}
            >
              {aumAnnualDrag}% / yr
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Industry safety threshold: &lt; 0.50%
            </span>
          </div>
        </div>

        {/* Expenses List */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: 'var(--border-width-thin) solid var(--border-subtle)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: 'var(--space-2)' }}>Category</th>
                <th style={{ padding: 'var(--space-2)' }}>Service & Provider</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Cost</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: 'var(--border-width-thin) solid var(--border-subtle)' }}
                >
                  <td
                    style={{ padding: 'var(--space-2)', fontWeight: 'var(--font-weight-medium)' }}
                  >
                    {item.category}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>{item.provider}</td>
                  <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                    ${item.amount.toFixed(2)} / mo
                  </td>
                  <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                    <Badge variant={item.essential ? 'neutral' : 'info'}>
                      {item.essential ? 'Essential' : 'Optional'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Budget Cap Control */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 'var(--space-2)',
            borderTop: 'var(--border-width-thin) solid var(--border-subtle)',
          }}
        >
          <label
            style={{
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
            }}
          >
            <span>Monthly Cost Cap ($):</span>
            <input
              type="number"
              step="10"
              min="50"
              max="1000"
              value={budgetCap}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) setBudgetCap(val);
              }}
              style={{
                width: '80px',
                padding: 'var(--space-1)',
                backgroundColor: 'var(--surface-sunken)',
                border: 'var(--border-width-thin) solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
              }}
            />
          </label>
        </div>
      </div>
    </Card>
  );
};
