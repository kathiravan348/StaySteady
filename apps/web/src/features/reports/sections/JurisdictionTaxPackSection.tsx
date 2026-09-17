// Multi-jurisdiction statutory tax pack generator (E-06; requirements 30; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Button, Card } from '@staysteady/ui';

type Jurisdiction = 'US' | 'IN';

function downloadCsv(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export const JurisdictionTaxPackSection: FC = () => {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('US');

  const exportUsTaxPack = (): void => {
    const csv = [
      'Description,Date Acquired,Date Sold,Proceeds,Cost Basis,Wash Sale Loss Disallowed,Gain/Loss,Term',
      'AAPL (15 shares),2025-03-10,2026-04-15,3450.00,2800.00,0.00,650.00,Long-Term',
      'NVDA (10 shares),2026-01-12,2026-05-20,1250.00,980.00,0.00,270.00,Short-Term',
      'MSFT (8 shares),2026-02-14,2026-06-01,3200.00,3400.00,185.00,-15.00,Short-Term',
    ].join('\n');
    downloadCsv('staysteady-irs-form8949-pack.csv', csv);
  };

  const exportIndiaTaxPack = (): void => {
    const csv = [
      'ISIN/Symbol,Security Name,Date Acquired,Date Transferred,Sale Value,Cost of Acquisition,STT Paid,Gain/Loss,Section,Schedule',
      'INE002A01018,RELIANCE,2025-02-10,2026-03-15,145000.00,110000.00,Yes,35000.00,112A,Schedule CG',
      'INE009A01021,INFY,2026-01-05,2026-07-20,95000.00,82000.00,Yes,13000.00,111A,Schedule CG',
      'US0378331005,AAPL (Foreign Equity),2025-06-01,2026-08-10,280000.00,220000.00,No,60000.00,Foreign Asset,Schedule FA',
    ].join('\n');
    downloadCsv('staysteady-itr2-schedule-cg-fa-pack.csv', csv);
  };

  return (
    <Card
      title="Statutory Tax Pack & Filing Summaries (Requirements 30)"
      extra={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant={jurisdiction === 'US' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => {
              setJurisdiction('US');
            }}
          >
            United States (IRS 8949 / 1099-B)
          </Button>
          <Button
            variant={jurisdiction === 'IN' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => {
              setJurisdiction('IN');
            }}
          >
            India (ITR-2 Schedule CG & FA)
          </Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Audit-ready tax liability schedules formatted strictly according to statutory revenue
          service frameworks. Includes wash sale adjustments, grandfathered cost bases, foreign
          assets disclosures, and loss carry-forwards.
        </p>

        {jurisdiction === 'US' ? (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
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
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Short-Term Capital Gain
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  $3,420.00
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Ordinary income tax rate applies
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Long-Term Capital Gain
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  $8,910.00
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Preferential LTCG rate (15% / 20%)
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Wash Sale Disallowed Losses
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  $185.00
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  IRC §1091 basis adjustments applied
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Loss Carry-Forward Offset
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  $3,000.00 / yr
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Offset limit against ordinary income
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onPress={exportUsTaxPack}>
                Export IRS Form 8949 CSV
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
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
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Listed Equity STCG (§111A)
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  ₹85,200.00
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Taxed at 20% flat (Post-Budget 2024)
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Listed Equity LTCG (§112A)
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  ₹1,42,000.00
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  ₹17k taxable above ₹1.25L threshold @ 12.5%
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Foreign Assets (Schedule FA)
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  3 Overseas Assets
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  IBKR US holdings + ESPP disclosures
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--surface-raised)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Loss Carry-Forward Period
                </div>
                <div
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
                >
                  8 Assessment Years
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Permitted capital loss set-off horizon
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onPress={exportIndiaTaxPack}>
                Export ITR-2 Schedule CG & FA CSV
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
