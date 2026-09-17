// Multi-asset screening universe seeds for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { ScreenerRow } from '../../schemas/screener';
import { SCREENER_SEEDS_IN } from './screenerSeedsIn';
import { SCREENER_SEEDS_US } from './screenerSeedsUs';

export { SCREENER_SEEDS_US } from './screenerSeedsUs';
export { SCREENER_SEEDS_IN } from './screenerSeedsIn';

// Compliance status and automation permission are not seeded: the screener search works them out
// from the compliance store and the saved configurations on every request (screenerStatus.ts).
export type ScreenerSeed = Omit<
  ScreenerRow,
  'complianceStatus' | 'complianceReason' | 'automationPermission'
>;

export const SCREENER_UNIVERSE: readonly ScreenerSeed[] = [
  ...SCREENER_SEEDS_US,
  ...SCREENER_SEEDS_IN,
];
