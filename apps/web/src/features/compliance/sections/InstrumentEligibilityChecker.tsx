// Interactive instrument eligibility evaluator for S-33 (requirements 27; UI spec 19.1).
// Answers plainly for any instrument: "May I trade this right now, and why not?"

import { useState } from 'react';
import type { FC } from 'react';
import { Badge, Button, Card } from '@staysteady/ui';

import type { EligibilityCheckResult } from '../../../data/schemas/compliance';
import { getEligibilityBadge } from '../model/complianceLabels';
import styles from '../Compliance.module.scss';

export interface InstrumentEligibilityCheckerProps {
  readonly onCheck: (symbol: string, action: 'BUY' | 'SELL') => Promise<EligibilityCheckResult>;
  readonly isChecking: boolean;
}

const PRESET_SYMBOLS = [
  { symbol: 'NVDA', desc: 'Restricted (MNPI)' },
  { symbol: 'NORTHWIND', desc: 'Employer Equity / Blackout' },
  { symbol: 'AAPL', desc: 'Holding Lock (30-day)' },
  { symbol: 'TSLA', desc: 'Short-Swing Rule' },
  { symbol: 'SPY', desc: 'Permitted ETF' },
];

export const InstrumentEligibilityChecker: FC<InstrumentEligibilityCheckerProps> = ({
  onCheck,
  isChecking,
}) => {
  const [symbol, setSymbol] = useState('NVDA');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [result, setResult] = useState<EligibilityCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEvaluate = async (targetSymbol = symbol, targetAction = action) => {
    if (!targetSymbol.trim()) return;
    setErrorMsg(null);
    try {
      const res = await onCheck(targetSymbol.trim(), targetAction);
      setResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Evaluation failed');
    }
  };

  const handlePresetClick = (presetSymbol: string) => {
    setSymbol(presetSymbol);
    // If AAPL, set SELL by default to demonstrate holding lock refusal
    const chosenAction = presetSymbol === 'AAPL' ? 'SELL' : action;
    if (presetSymbol === 'AAPL') setAction('SELL');
    void handleEvaluate(presetSymbol, chosenAction);
  };

  return (
    <Card title="Pre-Trade Instrument Eligibility Evaluator">
      <div className={styles.stack}>
        <p className={styles.bannerSubtext}>
          Evaluate trade eligibility before signal execution or manual order placement. Rules apply
          identically across automated strategies and manual actions to prevent policy breaches.
        </p>

        <div className={styles.checkerBox}>
          <div className={styles.inline}>
            <span className={styles.fieldLabel}>Quick presets:</span>
            {PRESET_SYMBOLS.map((p) => (
              <button
                key={p.symbol}
                type="button"
                className={styles.quickPill}
                onClick={() => handlePresetClick(p.symbol)}
              >
                {p.symbol} ({p.desc})
              </button>
            ))}
          </div>

          <div className={styles.inline}>
            <div className={styles.field}>
              <label htmlFor="eligibility-symbol" className={styles.fieldLabel}>
                Ticker Symbol
              </label>
              <input
                id="eligibility-symbol"
                className={styles.input}
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NVDA, MSFT, INFY"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="eligibility-action" className={styles.fieldLabel}>
                Trade Direction
              </label>
              <select
                id="eligibility-action"
                className={styles.select}
                value={action}
                onChange={(e) => setAction(e.target.value as 'BUY' | 'SELL')}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <Button
                variant="primary"
                onPress={() => void handleEvaluate()}
                isDisabled={isChecking || !symbol.trim()}
              >
                {isChecking ? 'Evaluating Policy...' : 'Evaluate Eligibility'}
              </Button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className={`${styles.banner} ${styles.bannerCritical}`}>
            <p className={styles.bannerText}>{errorMsg}</p>
          </div>
        )}

        {result && (
          <div
            className={`${styles.resultPanel} ${
              result.status === 'ALLOWED' ? styles.resultAllowed : styles.resultRefused
            }`}
          >
            <div className={styles.inlineBetween}>
              <div className={styles.inline}>
                <Badge variant={getEligibilityBadge(result.status).variant}>
                  {getEligibilityBadge(result.status).label}
                </Badge>
                <span className={styles.bannerText}>
                  {result.action} {result.symbol}: {result.primaryReason}
                </span>
              </div>
              <Badge variant="neutral">{result.policyClause}</Badge>
            </div>

            <p className={styles.bannerSubtext}>{result.details}</p>

            {result.restrictionsTriggered.length > 0 && (
              <div className={styles.stackTight}>
                <span className={styles.fieldLabel}>Policy constraints identified:</span>
                <ul className={styles.list}>
                  {result.restrictionsTriggered.map((item, idx) => (
                    <li key={idx} className={styles.bannerSubtext}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
