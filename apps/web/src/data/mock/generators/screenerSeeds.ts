// Multi-asset screening universe seeds for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { ScreenerRow } from '../../schemas/screener';
import { SCREENER_SEEDS_IN } from './screenerSeedsIn';
import { SCREENER_SEEDS_US } from './screenerSeedsUs';

export { SCREENER_SEEDS_US } from './screenerSeedsUs';
export { SCREENER_SEEDS_IN } from './screenerSeedsIn';

export const SCREENER_UNIVERSE: readonly ScreenerRow[] = [
  ...SCREENER_SEEDS_US,
  ...SCREENER_SEEDS_IN,
];
