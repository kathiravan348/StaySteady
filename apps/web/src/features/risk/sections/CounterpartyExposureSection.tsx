// Counterparty and custodian risk exposure breakdown (E-04; requirements 32; UI spec 19.2).

import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';
import styles from '../Risk.module.scss';

export interface CounterpartyInfo {
  readonly id: string;
  readonly name: string;
  readonly role: 'broker' | 'custodian' | 'bank' | 'employer';
  readonly sharePercent: number;
  readonly amountFormatted: string;
  readonly protectionScheme: string;
  readonly protectionLimit: string;
  readonly isConcentrated: boolean;
}

const COUNTERPARTIES: readonly CounterpartyInfo[] = [
  {
    id: 'cp-ibkr',
    name: 'Interactive Brokers LLC',
    role: 'broker',
    sharePercent: 52.4,
    amountFormatted: '$142,500.00',
    protectionScheme: 'SIPC / Lloyd’s Policy',
    protectionLimit: '$500,000 ($250k cash) + $30M excess',
    isConcentrated: true,
  },
  {
    id: 'cp-zerodha',
    name: 'Zerodha Broking & CDSL',
    role: 'broker',
    sharePercent: 18.8,
    amountFormatted: '₹42,50,000 ($51,200)',
    protectionScheme: 'SEBI IPF (Depository Direct)',
    protectionLimit: '₹25,00,000 per investor',
    isConcentrated: false,
  },
  {
    id: 'cp-hdfc',
    name: 'HDFC Bank Ltd.',
    role: 'bank',
    sharePercent: 11.1,
    amountFormatted: '₹25,00,000 ($30,100)',
    protectionScheme: 'DICGC Statutory Guarantee',
    protectionLimit: '₹5,00,000 principal + interest',
    isConcentrated: false,
  },
  {
    id: 'cp-chase',
    name: 'JPMorgan Chase Bank',
    role: 'bank',
    sharePercent: 6.8,
    amountFormatted: '$18,400.00',
    protectionScheme: 'FDIC Federal Insurance',
    protectionLimit: '$250,000 per depositor',
    isConcentrated: false,
  },
  {
    id: 'cp-etrade',
    name: 'Morgan Stanley / E*TRADE',
    role: 'employer',
    sharePercent: 10.9,
    amountFormatted: '$29,800.00',
    protectionScheme: 'SIPC (Employer Equity Custody)',
    protectionLimit: '$500,000 total',
    isConcentrated: false,
  },
];

export const CounterpartyExposureSection: FC = () => {
  return (
    <Card
      title="Counterparty & Custodian Exposure (Requirements 32)"
      extra={<Badge variant="warning">Concentration Alert: 1 counterparty &gt; 50%</Badge>}
    >
      <div className={styles.stack}>
        <p className={styles.meta} style={{ margin: 0 }}>
          Distribution of net worth across brokers, banks, and custodians. Monitors institutional
          solvency risk and statutory protection scheme thresholds.
        </p>

        <div className={styles.limitGrid}>
          {COUNTERPARTIES.map((cp) => (
            <div
              key={cp.id}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--surface-raised)',
                border: `var(--border-width-thin) solid ${
                  cp.isConcentrated ? 'var(--color-warning)' : 'var(--border-subtle)'
                }`,
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gap: 'var(--space-2)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {cp.name}
                </span>
                <Badge variant={cp.isConcentrated ? 'warning' : 'neutral'}>
                  {cp.sharePercent}% of wealth
                </Badge>
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {cp.amountFormatted}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}
                >
                  Role: {cp.role}
                </span>
              </div>

              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                  borderTop: 'var(--border-width-thin) solid var(--border-subtle)',
                  paddingTop: 'var(--space-2)',
                }}
              >
                <span>
                  Scheme: <strong>{cp.protectionScheme}</strong>
                </span>
                <br />
                <span>Limit: {cp.protectionLimit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
