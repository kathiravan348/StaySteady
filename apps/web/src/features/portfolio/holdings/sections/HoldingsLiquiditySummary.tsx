// Liquidity classification and non-market assets integration (E-01; requirements 25, 30; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Button } from '@staysteady/ui';
import { Decimal } from 'decimal.js';

import { useNetWorth } from '../../../../data/api/netWorthQueries';
import type { ManualAssetCategoryDto } from '../../../../data/schemas/net-worth';
import type { ReportCurrencyDto } from '../../../../data/schemas/reports';
import { formatMoney } from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import styles from '../HoldingsPage.module.scss';
import type { HoldingRow } from '../model/holdingTypes';

export interface HoldingsLiquiditySummaryProps {
  readonly rows: readonly HoldingRow[];
  readonly baseCurrency: BaseCurrencyCode;
}

const CATEGORY_LABELS: Readonly<Record<ManualAssetCategoryDto, string>> = {
  retirement: 'Retirement & PF',
  cash_deposit: 'Deposit / Savings',
  gold: 'Physical Gold',
  property: 'Real Estate',
  insurance: 'Insurance Savings',
  employer_equity: 'Employer Equity',
  liability: 'Debt / Loan',
};

export const HoldingsLiquiditySummary: FC<HoldingsLiquiditySummaryProps> = ({
  rows,
  baseCurrency,
}) => {
  const [includeNonMarket, setIncludeNonMarket] = useState(false);
  const { data: netWorth } = useNetWorth(baseCurrency as ReportCurrencyDto);

  // Traded portfolio value (all market-traded equities and ETFs settle in T+1 / Days)
  const tradedTotal = rows.reduce((sum, row) => sum.plus(row.valueBase.amount), new Decimal(0));

  // Manual assets categorized by liquidity (Requirements 25, 30)
  const manualAssets = netWorth?.assets ?? [];
  const manualNonLiabilities = manualAssets.filter((a) => a.asset.category !== 'liability');

  let manualImmediate = new Decimal(0);
  let manualWeeks = new Decimal(0);
  let manualMonths = new Decimal(0);

  manualNonLiabilities.forEach((item) => {
    const val = new Decimal(item.valueInCurrency.amount);
    if (item.asset.liquidity === 'immediate') {
      manualImmediate = manualImmediate.plus(val);
    } else if (item.asset.liquidity === 'within_month') {
      manualWeeks = manualWeeks.plus(val);
    } else {
      manualMonths = manualMonths.plus(val);
    }
  });

  const totalImmediate = includeNonMarket ? tradedTotal.plus(manualImmediate) : tradedTotal;
  const totalWeeks = includeNonMarket ? manualWeeks : new Decimal(0);
  const totalMonths = includeNonMarket ? manualMonths : new Decimal(0);
  const combinedTotal = totalImmediate.plus(totalWeeks).plus(totalMonths);

  return (
    <div className={styles.liquidityBar}>
      <div className={styles.toolbar} style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
          <span
            className={styles.liquidityLabel}
            style={{ fontWeight: 'var(--font-weight-semibold)' }}
          >
            Liquidity Horizon Breakdown (Requirements 30; UI Spec 19.2)
          </span>
          <span className={styles.liquiditySub}>
            T+1 Days (Liquid Markets) vs. Short-Term vs. Illiquid Asset Horizons
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              setIncludeNonMarket(!includeNonMarket);
            }}
          >
            {includeNonMarket ? 'Hide Manual Net Worth Assets' : 'Include Manual Non-Market Assets'}
          </Button>
        </div>
      </div>

      <div className={styles.liquidityGrid}>
        {/* Immediate / T+1 Days */}
        <div className={styles.liquidityCard}>
          <span className={styles.liquidityLabel}>Liquid / T+1 (Days)</span>
          <span className={styles.liquidityValue}>
            {formatMoney(createMoney(totalImmediate.toFixed(2), baseCurrency))}
          </span>
          <span className={styles.liquiditySub}>
            {combinedTotal.greaterThan(0)
              ? `${totalImmediate.dividedBy(combinedTotal).times(100).toFixed(1)}% of total wealth`
              : '100%'}
          </span>
        </div>

        {/* Short-Term / Weeks */}
        <div className={styles.liquidityCard}>
          <span className={styles.liquidityLabel}>Short-Term (Weeks)</span>
          <span className={styles.liquidityValue}>
            {formatMoney(createMoney(totalWeeks.toFixed(2), baseCurrency))}
          </span>
          <span className={styles.liquiditySub}>
            {combinedTotal.greaterThan(0)
              ? `${totalWeeks.dividedBy(combinedTotal).times(100).toFixed(1)}% of total wealth`
              : '0%'}
          </span>
        </div>

        {/* Illiquid / Months */}
        <div className={styles.liquidityCard}>
          <span className={styles.liquidityLabel}>Illiquid (Months / Years)</span>
          <span className={styles.liquidityValue}>
            {formatMoney(createMoney(totalMonths.toFixed(2), baseCurrency))}
          </span>
          <span className={styles.liquiditySub}>
            {combinedTotal.greaterThan(0)
              ? `${totalMonths.dividedBy(combinedTotal).times(100).toFixed(1)}% of total wealth`
              : '0%'}
          </span>
        </div>
      </div>

      {includeNonMarket && manualNonLiabilities.length > 0 && (
        <div style={{ marginTop: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}>
          <div className={styles.toolbar} style={{ justifyContent: 'space-between' }}>
            <span
              className={styles.liquidityLabel}
              style={{ fontWeight: 'var(--font-weight-semibold)' }}
            >
              Non-Market Manual Assets (Visually Distinct — Requirements 25; UI Spec 19.2)
            </span>
            <Badge variant="neutral">Not Traded by Automation</Badge>
          </div>

          <div className={styles.liquidityGrid}>
            {manualNonLiabilities.map((item) => (
              <div
                key={item.asset.id}
                className={styles.liquidityCard}
                style={{ background: 'var(--surface-raised)' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {item.asset.name}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <Badge variant="neutral" size="sm">
                      {CATEGORY_LABELS[item.asset.category]}
                    </Badge>
                    {item.isStale && (
                      <Badge variant="warning" size="sm">
                        STALE
                      </Badge>
                    )}
                    {!item.asset.verified && (
                      <Badge variant="info" size="sm">
                        UNVERIFIED
                      </Badge>
                    )}
                  </div>
                </div>
                <span className={styles.liquidityValue} style={{ fontSize: 'var(--font-size-sm)' }}>
                  {item.valueInCurrency.currency}{' '}
                  {parseFloat(item.valueInCurrency.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className={styles.liquidityLabel}>
                  Valued {item.asset.valuedOn} ({item.asset.method}) • Liquidity:{' '}
                  {item.asset.liquidity.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
