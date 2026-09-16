import type { HttpHandler } from 'msw';
import { systemHandlers } from './systemHandlers';
import { marketHandlers } from './marketHandlers';
import { portfolioHandlers } from './portfolioHandlers';
import { tradingHandlers } from './tradingHandlers';
import { researchHandlers } from './researchHandlers';
import { newsHandlers } from './newsHandlers';
import { researchDataHandlers } from './researchDataHandlers';
import { healthHandlers } from './healthHandlers';

/**
 * Combined MSW Request Handlers (M-01..M-14).
 * Provides mock API endpoints across all StaySteady domains.
 */
export const handlers: readonly HttpHandler[] = [
  ...systemHandlers,
  ...marketHandlers,
  ...portfolioHandlers,
  ...tradingHandlers,
  ...researchHandlers,
  ...newsHandlers,
  ...researchDataHandlers,
  ...healthHandlers,
];

export {
  healthHandlers,
  researchDataHandlers,
  systemHandlers,
  marketHandlers,
  portfolioHandlers,
  tradingHandlers,
  researchHandlers,
  newsHandlers,
};
