// In-memory allocation plan and goals for the page load (decisions 33 and 37).

import type { AllocationPlanInput, GoalInput } from '../../schemas';
import { seedGoals } from '../generators';

export interface SavedPlan {
  readonly plan: AllocationPlanInput;
  readonly savedAt: string;
  readonly reason: string;
}

// Example targets for the owner to replace: by instrument type and by currency, 5 points tolerance.
const SEED_PLAN: SavedPlan = {
  plan: {
    tolerancePercent: 5,
    targets: [
      { dimension: 'type', key: 'long_term', targetPercent: 35 },
      { dimension: 'type', key: 'etf', targetPercent: 30 },
      { dimension: 'type', key: 'commodity', targetPercent: 20 },
      { dimension: 'type', key: 'bond', targetPercent: 10 },
      { dimension: 'type', key: 'digital_asset', targetPercent: 5 },
      // Sector targets cover asset classes too, because that is what the sector view shows until
      // fund look-through lands (R-03). Targets per dimension must add up to 100.
      { dimension: 'sector', key: 'Information technology', targetPercent: 20 },
      { dimension: 'sector', key: 'Health care', targetPercent: 8 },
      { dimension: 'sector', key: 'Energy', targetPercent: 5 },
      { dimension: 'sector', key: 'Commodity', targetPercent: 25 },
      { dimension: 'sector', key: 'Broad market fund', targetPercent: 30 },
      { dimension: 'sector', key: 'Digital asset', targetPercent: 5 },
      { dimension: 'sector', key: 'Private credit', targetPercent: 7 },
      { dimension: 'currency', key: 'USD', targetPercent: 80 },
      { dimension: 'currency', key: 'INR', targetPercent: 10 },
      { dimension: 'currency', key: 'GBP', targetPercent: 10 },
    ],
  },
  savedAt: '2026-01-02T00:00:00.000Z',
  reason: 'Initial targets.',
};

let plan: SavedPlan | null = null;
let goals: GoalInput[] | null = null;

export const getPlan = (): SavedPlan => (plan ??= SEED_PLAN);
export const setPlan = (next: SavedPlan): void => {
  plan = next;
};

export const getGoals = (): GoalInput[] =>
  (goals ??= seedGoals(new Date().toISOString().slice(0, 10)));
export const setGoals = (next: GoalInput[]): void => {
  goals = next;
};
