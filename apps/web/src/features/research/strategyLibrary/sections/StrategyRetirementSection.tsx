// Strategy retirement criteria, demotion audit log & correlation matrix (E-08; requirements 28; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Button, Card } from '@staysteady/ui';

import { CORRELATION_MATRIX, DEMOTION_LOG } from './strategyRetirementData';

export const StrategyRetirementSection: FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'rules' | 'log'>('matrix');

  return (
    <Card
      title="Strategy Lifecycle Governance & Cross-Strategy Correlation (Requirements 28)"
      extra={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant={activeTab === 'matrix' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => {
              setActiveTab('matrix');
            }}
          >
            Correlation Matrix
          </Button>
          <Button
            variant={activeTab === 'rules' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => {
              setActiveTab('rules');
            }}
          >
            Retirement Rules
          </Button>
          <Button
            variant={activeTab === 'log' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => {
              setActiveTab('log');
            }}
          >
            Demotion History ({DEMOTION_LOG.length})
          </Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Systematic demotion criteria protect capital when strategies decay. Cross-strategy
          correlation monitors true portfolio diversification.
        </p>

        {activeTab === 'matrix' && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: 'var(--border-width-thin) solid var(--border-subtle)',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: 'var(--space-2)' }}>Strategy</th>
                    <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>MFA</th>
                    <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>ST</th>
                    <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>VA</th>
                    <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>DC</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRELATION_MATRIX.map((row) => (
                    <tr
                      key={row.short}
                      style={{
                        borderBottom: 'var(--border-width-thin) solid var(--border-subtle)',
                      }}
                    >
                      <td
                        style={{
                          padding: 'var(--space-2)',
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        {row.name} ({row.short})
                      </td>
                      {[row.s1, row.s2, row.s3, row.s4].map((val, idx) => {
                        const isHigh = val > 0.7 && val < 1.0;
                        const isNeg = val < 0;
                        return (
                          <td
                            key={idx}
                            style={{
                              padding: 'var(--space-2)',
                              textAlign: 'center',
                              fontWeight: isHigh ? 'var(--font-weight-bold)' : 'normal',
                              color: isHigh
                                ? 'var(--color-warning, #e6a700)'
                                : isNeg
                                  ? 'var(--change-profit)'
                                  : 'inherit',
                              backgroundColor: isHigh ? 'var(--surface-sunken)' : 'transparent',
                            }}
                          >
                            {val.toFixed(2)}
                            {isHigh && ' ⚠'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                padding: 'var(--space-2)',
                backgroundColor: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              ⚠ High Correlation Alert: <strong>MFA</strong> and <strong>DC</strong> exhibit 0.74
              correlation. Holding both increases combined drawdowns in cyclical pullbacks.
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  Drawdown Breaker
                </span>
                <Badge variant="negative">Max 15.0%</Badge>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Demotes Live strategy directly to Quarantined Paper stage if peak-to-trough drawdown
                exceeds 15%.
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
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  Alpha Decay Breaker
                </span>
                <Badge variant="warning">&gt; 5.0% Lag</Badge>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Triggers review and size reduction if rolling 90-day return lags benchmark by over
                500 basis points.
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
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  Sharpe Floor
                </span>
                <Badge variant="neutral">&lt; 0.50 SR</Badge>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Mandates retirement if 6-month realized Sharpe ratio falls below 0.50 risk-adjusted
                efficiency.
              </span>
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {DEMOTION_LOG.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'grid',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    {entry.strategyName}
                  </span>
                  <Badge variant="warning">
                    {entry.fromStage} &rarr; {entry.toStage}
                  </Badge>
                </div>
                <div style={{ color: 'var(--change-loss)' }}>Trigger: {entry.triggerReason}</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Action: {entry.capitalAction} • {entry.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
