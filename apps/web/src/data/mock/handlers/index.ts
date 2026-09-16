import type { HttpHandler } from 'msw';
import { systemHandlers } from './systemHandlers';
import { marketHandlers } from './marketHandlers';
import { portfolioHandlers } from './portfolioHandlers';
import { tradingHandlers } from './tradingHandlers';
import { researchHandlers } from './researchHandlers';
import { newsHandlers } from './newsHandlers';
import { researchDataHandlers } from './researchDataHandlers';
import { healthHandlers } from './healthHandlers';
import { riskHandlers } from './riskHandlers';
import { configHandlers } from './configHandlers';

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
  ...riskHandlers,
  ...configHandlers,
];

export {
  configHandlers,
  healthHandlers,
  riskHandlers,
  researchDataHandlers,
  systemHandlers,
  marketHandlers,
  portfolioHandlers,
  tradingHandlers,
  researchHandlers,
  newsHandlers,
};
