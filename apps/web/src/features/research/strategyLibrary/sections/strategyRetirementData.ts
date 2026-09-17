// Data models and constants for strategy retirement and correlation matrix (E-08).

export interface DemotionLogEntry {
  readonly id: string;
  readonly date: string;
  readonly strategyName: string;
  readonly fromStage: string;
  readonly toStage: string;
  readonly triggerReason: string;
  readonly capitalAction: string;
}

export const DEMOTION_LOG: readonly DemotionLogEntry[] = [
  {
    id: 'dem-1',
    date: '2026-08-14',
    strategyName: 'Volatility Breakout Crypto',
    fromStage: 'Live Real Money',
    toStage: 'Retired / Archived',
    triggerReason: 'Trailing drawdown exceeded 15.0% (-18.2% recorded)',
    capitalAction: '$25,000.00 capital reallocated to high-yield reserve sweep',
  },
  {
    id: 'dem-2',
    date: '2026-05-02',
    strategyName: 'Small-Cap Micro Momentum',
    fromStage: 'Live Real Money',
    toStage: 'Quarantined (Paper)',
    triggerReason: '90-day alpha decay (-6.1% relative underperformance vs benchmark)',
    capitalAction: 'Trading disabled; automated signal generation under observation',
  },
];

export const CORRELATION_MATRIX = [
  { name: 'Multi-Factor Alpha', short: 'MFA', s1: 1.0, s2: 0.32, s3: -0.18, s4: 0.74 },
  { name: 'Statistical Trend', short: 'ST', s1: 0.32, s2: 1.0, s3: 0.05, s4: 0.28 },
  { name: 'Volatility Arbitrage', short: 'VA', s1: -0.18, s2: 0.05, s3: 1.0, s4: -0.22 },
  { name: 'Dividend Compounder', short: 'DC', s1: 0.74, s2: 0.28, s3: -0.22, s4: 1.0 },
] as const;
