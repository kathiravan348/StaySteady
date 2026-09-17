// Inflation benchmark assumptions subcard for USD and INR (E-09).

import type { FC } from 'react';
import { Badge } from '@staysteady/ui';

export interface InflationAssumptionsSubcardProps {
  readonly usInflation: number;
  readonly inInflation: number;
  readonly onUsChange: (val: number) => void;
  readonly onInChange: (val: number) => void;
}

export const InflationAssumptionsSubcard: FC<InflationAssumptionsSubcardProps> = ({
  usInflation,
  inInflation,
  onUsChange,
  onInChange,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}
          >
            United States (USD) Inflation
          </span>
          <Badge variant="neutral">CPI Benchmark</Badge>
        </div>
        <label
          style={{
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Annual CPI Rate (%):</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={usInflation}
            onChange={(e) => {
              onUsChange(Number(e.target.value));
            }}
            style={{
              width: '80px',
              padding: 'var(--space-1)',
              backgroundColor: 'var(--surface-sunken)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'right',
            }}
          />
        </label>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Used to adjust nominal USD returns to net real purchasing power.
        </span>
      </div>

      <div
        style={{
          padding: 'var(--space-3)',
          backgroundColor: 'var(--surface-raised)',
          border: 'var(--border-width-thin) solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'grid',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}
          >
            India (INR) Inflation
          </span>
          <Badge variant="neutral">CPI Benchmark</Badge>
        </div>
        <label
          style={{
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Annual CPI Rate (%):</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={inInflation}
            onChange={(e) => {
              onInChange(Number(e.target.value));
            }}
            style={{
              width: '80px',
              padding: 'var(--space-1)',
              backgroundColor: 'var(--surface-sunken)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'right',
            }}
          />
        </label>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Used to adjust nominal INR returns and long-term goal compounding.
        </span>
      </div>
    </div>
  );
};
