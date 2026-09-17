// Tax category, holding-period boundary, and cost of disposing today (E-02; requirements 26; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';
import { Decimal } from 'decimal.js';

import { formatMoney, formatNumber, pluralize } from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import type { HoldingRow } from '../../holdings/model/holdingTypes';
import styles from '../PositionPage.module.scss';

export interface PositionDisposalEstimatorProps {
  readonly row: HoldingRow;
}

export const PositionDisposalEstimator: FC<PositionDisposalEstimatorProps> = ({ row }) => {
  const [disposeQuantity, setDisposeQuantity] = useState<number>(row.quantity);

  const price = new Decimal(row.lastPrice.amount);
  const qty = new Decimal(Math.min(Math.max(0, disposeQuantity), row.quantity));
  const grossProceeds = qty.times(price);

  // Brokerage + Exchange/Regulatory costs (Requirements 26)
  const isUs = row.instrument.currency === 'USD';
  const commission = isUs
    ? Decimal.max(new Decimal('1.00'), qty.times('0.005'))
    : Decimal.min(new Decimal('20.00'), grossProceeds.times('0.0003'));
  const regulatoryFees = isUs
    ? grossProceeds.times('0.0000278') // SEC fee
    : grossProceeds.times('0.001'); // Securities Transaction Tax (STT)
  const totalTransactionCosts = commission.plus(regulatoryFees);

  // Evaluate lots under FIFO to determine STCG vs LTCG portions
  let remainingQty = qty;
  let stcgGain = new Decimal(0);
  let ltcgGain = new Decimal(0);

  for (const lot of row.lots) {
    if (remainingQty.isZero()) break;
    const lotQty = new Decimal(lot.quantity);
    const takeQty = Decimal.min(remainingQty, lotQty);
    const lotCost = new Decimal(lot.costPerUnit.amount);
    const lotGain = takeQty.times(price.minus(lotCost));

    if (lot.daysHeld >= 365) {
      ltcgGain = ltcgGain.plus(lotGain);
    } else {
      stcgGain = stcgGain.plus(lotGain);
    }
    remainingQty = remainingQty.minus(takeQty);
  }

  // Estimated tax: STCG ~30% marginal, LTCG ~15% preferential
  const stcgTax = Decimal.max(new Decimal(0), stcgGain.times('0.30'));
  const ltcgTax = Decimal.max(new Decimal(0), ltcgGain.times('0.15'));
  const totalEstimatedTax = stcgTax.plus(ltcgTax);
  const netProceeds = grossProceeds.minus(totalTransactionCosts).minus(totalEstimatedTax);

  return (
    <div className={styles.panelStack}>
      {/* Holding-Period Boundary & Tax Lots */}
      <Card title="Tax Lots & Holding-Period Boundaries (Requirements 26)">
        <div className={styles.panelStack}>
          <p className={styles.legend} style={{ margin: 0 }}>
            365-day threshold for Long-Term Capital Gains (LTCG). Lots approaching transition
            benefit from delaying disposal to capture preferential tax rates.
          </p>

          <table className={styles.list} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-width-thin) solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'start', padding: 'var(--space-2)' }}>Lot Purchased</th>
                <th style={{ textAlign: 'end', padding: 'var(--space-2)' }}>Qty</th>
                <th style={{ textAlign: 'end', padding: 'var(--space-2)' }}>Cost Basis</th>
                <th style={{ textAlign: 'start', padding: 'var(--space-2)' }}>Holding Period</th>
                <th style={{ textAlign: 'start', padding: 'var(--space-2)' }}>Tax Status</th>
                <th style={{ textAlign: 'start', padding: 'var(--space-2)' }}>Boundary Notice</th>
              </tr>
            </thead>
            <tbody>
              {row.lots.map((lot) => {
                const daysRemaining = Math.max(0, 365 - lot.daysHeld);
                const isLtcg = lot.daysHeld >= 365;
                const isApproaching = daysRemaining > 0 && daysRemaining <= 30;

                return (
                  <tr
                    key={lot.id}
                    style={{ borderBottom: 'var(--border-width-thin) solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: 'var(--space-2)' }}>{lot.purchaseDate}</td>
                    <td style={{ textAlign: 'end', padding: 'var(--space-2)' }}>
                      {formatNumber(lot.quantity)}
                    </td>
                    <td style={{ textAlign: 'end', padding: 'var(--space-2)' }}>
                      {formatMoney(lot.costPerUnit, { showCurrency: 'code' })}
                    </td>
                    <td style={{ padding: 'var(--space-2)' }}>{pluralize(lot.daysHeld, 'day')}</td>
                    <td style={{ padding: 'var(--space-2)' }}>
                      {isLtcg ? (
                        <Badge variant="positive">LTCG (15%)</Badge>
                      ) : (
                        <Badge variant="neutral">STCG (30%)</Badge>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-2)' }}>
                      {isApproaching ? (
                        <Badge variant="warning">⏳ {daysRemaining} days to LTCG</Badge>
                      ) : isLtcg ? (
                        <span
                          style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}
                        >
                          Preferential rate locked
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {daysRemaining} days left
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cost of Disposing Today Estimator */}
      <Card title="Estimated Cost of Disposing Today (Before You Trade)">
        <div className={styles.panelStack}>
          <div
            className={styles.inline}
            style={{ justifyContent: 'space-between', alignItems: 'center' }}
          >
            <label
              htmlFor="disp-qty-input"
              style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}
            >
              Shares to liquidate (FIFO order):
            </label>
            <div className={styles.inline}>
              <input
                id="disp-qty-input"
                type="number"
                min={0}
                max={row.quantity}
                value={disposeQuantity}
                onChange={(e) => setDisposeQuantity(Number(e.target.value))}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-width-thin) solid var(--border-default)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                  width: '7rem',
                  textAlign: 'right',
                }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                of {row.quantity} held
              </span>
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.keyValues}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Gross Realized Value
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {formatMoney(createMoney(grossProceeds, row.instrument.currency))}
              </span>
            </div>

            <div className={styles.keyValues}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Commissions & Exchange Fees
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-danger)',
                }}
              >
                - {formatMoney(createMoney(totalTransactionCosts, row.instrument.currency))}
              </span>
            </div>

            <div className={styles.keyValues}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Estimated Tax Liability
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-danger)',
                }}
              >
                - {formatMoney(createMoney(totalEstimatedTax, row.instrument.currency))}
              </span>
            </div>

            <div className={styles.keyValues}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Net Cash Proceeds
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-success)',
                }}
              >
                {formatMoney(createMoney(netProceeds, row.instrument.currency))}
              </span>
            </div>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0 }}>
            * Breakdown: STCG tax {formatMoney(createMoney(stcgTax, row.instrument.currency))} +
            LTCG tax {formatMoney(createMoney(ltcgTax, row.instrument.currency))}. The system
            prepares and organizes tax estimates; it never files tax returns (Requirements 26).
          </p>
        </div>
      </Card>
    </div>
  );
};
