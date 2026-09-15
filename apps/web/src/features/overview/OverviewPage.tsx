// Overview landing screen (UI spec 7.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';
import { useSystemState } from '../../providers/SystemStateProvider';
import { createMoney } from '../../shared/money';
import { formatMoney, formatGainLossCombined } from '../../shared/format';
import { calculateGainLoss } from '../../shared/money';

export function OverviewPage(): ReactElement {
  const { baseCurrency } = useSystemState();

  const totalValue = createMoney('125430.50', baseCurrency);
  const costBasis = createMoney('118200.00', baseCurrency);
  const totalReturn = calculateGainLoss(totalValue, costBasis);

  return (
    <PageShell
      title="Platform Overview"
      description="Personal multi-market investment tracking, live signals, and safety posture"
      breadcrumbs={[{ label: 'Home', to: '/overview' }, { label: 'Overview' }]}
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
        aria-label="Key Portfolio Metrics"
      >
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: 'var(--border-width-thin) solid var(--border-subtle)',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Total Portfolio Value
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              marginTop: 'var(--space-1)',
              fontVariantNumeric: 'var(--font-variant-numeric)',
            }}
          >
            {formatMoney(totalValue, { showCurrency: 'both' })}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: 'var(--border-width-thin) solid var(--border-subtle)',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Total Unrealised Return
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              marginTop: 'var(--space-1)',
              color: 'var(--change-gain)',
              fontVariantNumeric: 'var(--font-variant-numeric)',
            }}
          >
            {formatGainLossCombined(totalReturn)}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: 'var(--border-width-thin) solid var(--border-subtle)',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Automation Posture
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              marginTop: 'var(--space-1)',
              color: 'var(--mode-simulation)',
            }}
          >
            Simulation Mode
          </div>
        </div>
      </section>

      <section
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border-width-thin) solid var(--border-subtle)',
          marginTop: 'var(--space-4)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginTop: 0 }}>System Foundation Active</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
          Stage F Foundations completed: Branded domain types for instruments, timestamps and
          quantities, arbitrary-precision financial arithmetic with Decimal.js, multi-timezone
          session models, accessible responsive shell, and full application routing structure.
        </p>
      </section>
    </PageShell>
  );
}
