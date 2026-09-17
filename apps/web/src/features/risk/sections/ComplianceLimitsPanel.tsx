// Compliance limits overlay in Risk dashboard (E-04; requirements 27, 32; UI spec 19.2).

import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card } from '@staysteady/ui';

import { useCompliance } from '../../../data/api/complianceQueries';
import type { BlackoutWindow } from '../../../data/schemas/compliance';
import { ROUTES } from '../../../routes/routes';
import styles from '../Risk.module.scss';

export const ComplianceLimitsPanel: FC = () => {
  const { data: compliance } = useCompliance();

  const activeBlackouts =
    compliance?.blackoutWindows.filter((w: BlackoutWindow) => w.status === 'ACTIVE') ?? [];
  const restrictedCount = compliance?.restrictedInstruments.length ?? 0;
  const locksCount = compliance?.holdingLocks.length ?? 0;
  const refusalsCount = compliance?.refusals.length ?? 0;

  return (
    <Card
      title="Compliance & Policy Enforcement Limits (Requirements 27)"
      extra={
        <Link
          to={ROUTES.SETTINGS_BROKERS}
          className={styles.link}
          style={{ fontSize: 'var(--font-size-xs)' }}
        >
          Manage S-33 Policies &rarr;
        </Link>
      }
    >
      <div className={styles.stack}>
        <p className={styles.meta} style={{ margin: 0 }}>
          Regulatory and personal account dealing limits enforced at signal stage by the same safety
          layer as quantitative risk limits. Prohibitions terminate orders before they reach a
          broker.
        </p>

        <div className={styles.limitGrid}>
          {/* Active Blackout Status */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-raised)',
              border: `var(--border-width-thin) solid ${
                activeBlackouts.length > 0 ? 'var(--color-warning)' : 'var(--border-subtle)'
              }`,
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Blackout Windows
              </span>
              <Badge variant={activeBlackouts.length > 0 ? 'warning' : 'positive'}>
                {activeBlackouts.length > 0 ? 'Active Quiet Period' : 'Open / Clear'}
              </Badge>
            </div>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>
              {activeBlackouts.length > 0
                ? `${activeBlackouts[0]?.name} (${activeBlackouts[0]?.daysRemaining}d remaining)`
                : 'No corporate blackout periods active'}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Pre-clearance mandatory during earnings or material project windows.
            </span>
          </div>

          {/* Restricted Instruments */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Restricted Securities
              </span>
              <Badge variant="neutral">{restrictedCount} Prohibited</Badge>
            </div>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>
              Prohibited from manual and automated trading
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Enforced by ticker symbol and asset class across all linked accounts.
            </span>
          </div>

          {/* Minimum Holding Locks */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Holding Period Locks
              </span>
              <Badge variant="neutral">{locksCount} Locked Lots</Badge>
            </div>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>
              30-day / 90-day anti-round-trip lock
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Prevents short-swing speculative trading in employer and designated securities.
            </span>
          </div>

          {/* Intercepted Refusals */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-raised)',
              border: 'var(--border-width-thin) solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Signal-Stage Refusals
              </span>
              <Badge variant="positive">{refusalsCount} Intercepted</Badge>
            </div>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>
              Blocked before broker order creation
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Zero prohibited orders have leaked to live broker execution queues.
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
