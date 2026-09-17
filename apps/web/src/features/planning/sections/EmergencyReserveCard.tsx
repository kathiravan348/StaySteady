// Emergency reserve fund gauge with strict trading segregation (E-07; requirements 29; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

export const EmergencyReserveCard: FC = () => {
  const [monthlyExpense, setMonthlyExpense] = useState(4500);
  const [targetMonths, setTargetMonths] = useState(6);
  const currentReserve = 36900; // Liquid segregated savings

  const targetAmount = monthlyExpense * targetMonths;
  const currentMonths = (currentReserve / monthlyExpense).toFixed(1);
  const isFunded = currentReserve >= targetAmount;
  const surplusDeficit = currentReserve - targetAmount;

  return (
    <Card
      title="Life Emergency Reserve Fund (Requirements 29)"
      extra={
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Badge variant={isFunded ? 'positive' : 'warning'}>
            {currentMonths} Months Funded ({isFunded ? 'Surplus' : 'Deficit'})
          </Badge>
          <Badge variant="neutral">Strictly Segregated from Trading Margin</Badge>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Dedicated survival liquidity segregated from algorithmic trading accounts. This capital is
          never encumbered, pledged as margin, or exposed to broker liquidation risk.
        </p>

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
              Current Liquid Reserve
            </span>
            <span
              style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
            >
              ${currentReserve.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--change-profit)' }}>
              {currentMonths} months of survival runway
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
              Target Safety Runway
            </span>
            <span
              style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
            >
              ${targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Based on {targetMonths} months target runway
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
              Safety Buffer (Surplus)
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: surplusDeficit >= 0 ? 'var(--change-profit)' : 'var(--change-loss)',
              }}
            >
              {surplusDeficit >= 0 ? '+' : ''}$
              {surplusDeficit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              {surplusDeficit >= 0 ? 'Comfortable buffer' : 'Capital top-up recommended'}
            </span>
          </div>
        </div>

        {/* Sliders for runway testing */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
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
            <span>Monthly Living Expenses:</span>
            <input
              type="number"
              value={monthlyExpense}
              step={250}
              min={1000}
              max={25000}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) setMonthlyExpense(val);
              }}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                backgroundColor: 'var(--surface-sunken)',
                border: 'var(--border-width-thin) solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                width: '100px',
              }}
            />
          </label>

          <label
            style={{
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
            }}
          >
            <span>Target Runway:</span>
            <select
              value={targetMonths}
              onChange={(e) => {
                setTargetMonths(Number(e.target.value));
              }}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                backgroundColor: 'var(--surface-sunken)',
                border: 'var(--border-width-thin) solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
              }}
            >
              <option value={3}>3 Months (Lean)</option>
              <option value={6}>6 Months (Standard)</option>
              <option value={9}>9 Months (Prudent)</option>
              <option value={12}>12 Months (Conservative)</option>
            </select>
          </label>
        </div>
      </div>
    </Card>
  );
};
