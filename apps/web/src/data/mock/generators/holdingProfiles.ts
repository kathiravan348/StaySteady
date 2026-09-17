// Account, strategy, exit and lot-timing settings for each mock holding (M-09, session 21).
// Fixed lot ages exercise the screens' states: a SPY lot close to the long-term tax threshold,
// a recent (short-term) BTC lot, and an AAPL exit level close to the price.

export interface HoldingProfile {
  readonly brokerId: string;
  readonly openedByStrategyId?: string;
  // Exit level as a fraction below the latest daily close; absent when no exit is set.
  readonly exitBelowClose?: number;
  // Purchase dates as trading days before the latest bar, oldest first; random when absent.
  readonly lotTradingDaysAgo?: readonly number[];
}

export const HOLDING_PROFILES: Readonly<Record<string, HoldingProfile>> = {
  'inst-us-aapl': {
    brokerId: 'brk-ibkr',
    openedByStrategyId: 'strat-trend-momentum',
    exitBelowClose: 0.025,
  },
  'inst-us-spy': {
    brokerId: 'brk-ibkr',
    openedByStrategyId: 'strat-trend-momentum',
    exitBelowClose: 0.12,
    // ~243 trading days is roughly 350 calendar days: inside the 30-day "approaching" window.
    lotTradingDaysAgo: [900, 520, 243],
  },
  'inst-us-btc': {
    brokerId: 'brk-ibkr',
    openedByStrategyId: 'strat-breakout-vol',
    exitBelowClose: 0.07,
    lotTradingDaysAgo: [55],
  },
  'inst-us-gold': {
    brokerId: 'brk-ibkr',
    openedByStrategyId: 'strat-breakout-vol',
    exitBelowClose: 0.15,
  },
  'inst-in-reliance': {
    brokerId: 'brk-zerodha',
    exitBelowClose: 0.18,
  },
  // Two companies of one business group, so group exposure is a real number rather than a
  // feature with no data behind it (R-03, decision 51).
  'inst-in-tatamotors': {
    brokerId: 'brk-zerodha',
    exitBelowClose: 0.14,
  },
  'inst-in-tcs': {
    brokerId: 'brk-zerodha',
  },
  'inst-uk-azn': {
    brokerId: 'brk-hl',
  },
  'inst-manual-bond': {
    brokerId: 'brk-private-notes',
  },
};
