// Liquidity ladder & decumulation withdrawal simulation (E-07; requirements 29; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

interface LadderBucket {
  readonly id: string;
  readonly horizon: string;
  readonly assetTypes: string;
  readonly amountFormatted: string;
  readonly percentOfTotal: string;
  readonly coverageNote: string;
}

const BUCKETS: readonly LadderBucket[] = [
  {
    id: 'b1',
    horizon: '< 7 Days (Immediate)',
    assetTypes: 'Bank High-Yield Sweeps & Cash',
    amountFormatted: '$36,900.00',
    percentOfTotal: '11.5%',
    coverageNote: 'Immediate emergency runway & unplanned shocks',
  },
  {
    id: 'b2',
    horizon: '8 - 30 Days (Short-Term)',
    assetTypes: 'T-Bills (30d) & Money Market Funds',
    amountFormatted: '$45,000.00',
    percentOfTotal: '14.0%',
    coverageNote: 'Quarterly estimated tax ($4.8k) & annual insurance ($2.4k)',
  },
  {
    id: 'b3',
    horizon: '1 - 12 Months (Medium-Term)',
    assetTypes: 'Short Duration Debt & Fixed Deposits',
    amountFormatted: '$68,000.00',
    percentOfTotal: '21.1%',
    coverageNote: 'Capital expenditures & 1-year planned commitments',
  },
  {
    id: 'b4',
    horizon: '> 1 Year (Long-Term Growth)',
    assetTypes: 'Algorithmic Equities, ETFs & Non-Market',
    amountFormatted: '$172,000.00',
    percentOfTotal: '53.4%',
    coverageNote: 'Long-term compound wealth; never sold under duress',
  },
];

export const LiquidityLadderSection: FC = () => {
  const [withdrawalRate, setWithdrawalRate] = useState(3.5);
  const totalPortfolio = 321900;

  const annualWithdrawal = (totalPortfolio * (withdrawalRate / 100)).toFixed(0);
  const monthlyWithdrawal = (Number(annualWithdrawal) / 12).toFixed(0);
  const liquidRunwayYears = ((36900 + 45000 + 68000) / Number(annualWithdrawal)).toFixed(1);

  return (
    <Card
      title="Liquidity Ladder & Decumulation Horizon (Requirements 29)"
      extra={<Badge variant="positive">Protected from Sequence Risk</Badge>}
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Structures portfolio assets into graduated maturity tiers matched against committed
          expenditures. Enables stress-free systematic withdrawals without forced selling of
          depressed risk assets during market drawdowns.
        </p>

        {/* 4 Ladder Tiers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {BUCKETS.map((bucket) => (
            <div
              key={bucket.id}
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--surface-raised)',
                border: 'var(--border-width-thin) solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gap: 'var(--space-1)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  {bucket.horizon}
                </span>
                <Badge variant="neutral">{bucket.percentOfTotal}</Badge>
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                {bucket.amountFormatted}
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                {bucket.assetTypes}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--interactive-primary)',
                  paddingTop: 'var(--space-1)',
                  borderTop: 'var(--border-width-thin) solid var(--border-subtle)',
                }}
              >
                {bucket.coverageNote}
              </span>
            </div>
          ))}
        </div>

        {/* Decumulation Phase Simulator */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-md)',
            display: 'grid',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}
            >
              Decumulation & Safe Withdrawal Simulation
            </span>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
              }}
            >
              <span>Safe Withdrawal Rate (SWR):</span>
              <select
                value={withdrawalRate}
                onChange={(e) => {
                  setWithdrawalRate(Number(e.target.value));
                }}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value={3.0}>3.0% (Ultra-Safe)</option>
                <option value={3.5}>3.5% (Recommended)</option>
                <option value={4.0}>4.0% (Bengen 4% Rule)</option>
                <option value={4.5}>4.5% (High Cash Flow)</option>
              </select>
            </label>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-3)',
              paddingTop: 'var(--space-2)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Annual Sustainable Cash Flow
              </span>
              <div
                style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}
              >
                ${Number(annualWithdrawal).toLocaleString()} / yr
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Monthly Passive Income
              </span>
              <div
                style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}
              >
                ${Number(monthlyWithdrawal).toLocaleString()} / mo
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Non-Equity Runway Buffer
              </span>
              <div
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--change-profit)',
                }}
              >
                {liquidRunwayYears} Years of Bear Market Runway
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
