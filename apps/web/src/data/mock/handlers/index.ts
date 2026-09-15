import type { HttpHandler } from 'msw';
import { systemHandlers } from './systemHandlers';
import { marketHandlers } from './marketHandlers';
import { portfolioHandlers } from './portfolioHandlers';
import { tradingHandlers } from './tradingHandlers';
import { researchHandlers } from './researchHandlers';
import { newsHandlers } from './newsHandlers';

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
];

export {
  systemHandlers,
  marketHandlers,
  portfolioHandlers,
  tradingHandlers,
  researchHandlers,
  newsHandlers,
};
