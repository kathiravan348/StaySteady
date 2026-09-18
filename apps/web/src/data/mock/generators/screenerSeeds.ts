// Multi-asset screening universe seeds for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { ScreenerRow } from '../../schemas/screener';
import { SCREENER_SEEDS_IN } from './screenerSeedsIn';
import { SCREENER_SEEDS_US } from './screenerSeedsUs';

export { SCREENER_SEEDS_US } from './screenerSeedsUs';
export { SCREENER_SEEDS_IN } from './screenerSeedsIn';

// Compliance status and automation permission are not seeded: the screener search works them out
// from the compliance store and the saved configurations on every request (screenerStatus.ts).
// Statement factors are never seeded either: screenerFactors.ts reads them from the measures
// (R-13), so a company with no statements has none rather than a made-up figure.
export type StatementFactorKey =
  'debtToEquity' | 'rocePct' | 'revenueGrowth3yPct' | 'cashConversionPct';
export type ScreenerSeed = Omit<
  ScreenerRow,
  'complianceStatus' | 'complianceReason' | 'automationPermission' | StatementFactorKey
>;
export type FactoredSeed = ScreenerSeed & Pick<ScreenerRow, StatementFactorKey>;

export const SCREENER_UNIVERSE: readonly ScreenerSeed[] = [
  ...SCREENER_SEEDS_US,
  ...SCREENER_SEEDS_IN,
];
