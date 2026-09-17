// Statutory tax rules and inflation assumptions configuration (E-09; requirements 30, 34; UI spec 19.2).

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Button, Card } from '@staysteady/ui';

import { InflationAssumptionsSubcard } from './InflationAssumptionsSubcard';

export const TaxRulesAndInflationSection: FC = () => {
  const [usInflation, setUsInflation] = useState(3.2);
  const [inInflation, setInInflation] = useState(5.1);
  const [usStcgRate, setUsStcgRate] = useState(24.0);
  const [usLtcgRate, setUsLtcgRate] = useState(15.0);
  const [inStcgRate, setInStcgRate] = useState(20.0);
  const [inLtcgRate, setInLtcgRate] = useState(12.5);
  const [sec1256Enabled, setSec1256Enabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (): void => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <Card
      title="Statutory Tax Rules & Inflation Assumptions (Requirements 30)"
      extra={
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {isSaved && <Badge variant="positive">Assumptions Saved</Badge>}
          <Button variant="primary" size="sm" onPress={handleSave}>
            Save Assumptions
          </Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Configures the statutory tax brackets, Section 1256 option rules, and benchmark CPI
          inflation rates utilized across the platform for real-return calculation, disposal tax
          estimation, and goals modeling.
        </p>

        {/* Inflation Assumptions */}
        <InflationAssumptionsSubcard
          usInflation={usInflation}
          inInflation={inInflation}
          onUsChange={setUsInflation}
          onInChange={setInInflation}
        />

        {/* Tax Rules Configuration */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {/* US Jurisdiction Rules */}
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
            <span
              style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}
            >
              US Federal Tax Parameters
            </span>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Estimated STCG Rate (%):</span>
              <input
                type="number"
                step="1"
                value={usStcgRate}
                onChange={(e) => {
                  setUsStcgRate(Number(e.target.value));
                }}
                style={{
                  width: '70px',
                  padding: 'var(--space-1)',
                  backgroundColor: 'var(--surface-sunken)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                }}
              />
            </label>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>LTCG Rate (%):</span>
              <input
                type="number"
                step="1"
                value={usLtcgRate}
                onChange={(e) => {
                  setUsLtcgRate(Number(e.target.value));
                }}
                style={{
                  width: '70px',
                  padding: 'var(--space-1)',
                  backgroundColor: 'var(--surface-sunken)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                }}
              />
            </label>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-1)',
              }}
            >
              <input
                type="checkbox"
                checked={sec1256Enabled}
                onChange={(e) => {
                  setSec1256Enabled(e.target.checked);
                }}
              />
              <span>Apply Section 1256 60/40 rule to index options</span>
            </label>
          </div>

          {/* India Jurisdiction Rules */}
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
            <span
              style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}
            >
              India Tax Parameters (Post-Budget 2024)
            </span>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>STCG §111A Rate (%):</span>
              <input
                type="number"
                step="0.5"
                value={inStcgRate}
                onChange={(e) => {
                  setInStcgRate(Number(e.target.value));
                }}
                style={{
                  width: '70px',
                  padding: 'var(--space-1)',
                  backgroundColor: 'var(--surface-sunken)',
                  border: 'var(--border-width-thin) solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                }}
              />
            </label>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>LTCG §112A Rate (%):</span>
              <input
                type="number"
                step="0.5"
                value={inLtcgRate}
                onChange={(e) => {
                  setInLtcgRate(Number(e.target.value));
                }}
                style={{
                  width: '70px',
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
              LTCG includes statutory ₹1,25,000 yearly exemption on listed equities.
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
