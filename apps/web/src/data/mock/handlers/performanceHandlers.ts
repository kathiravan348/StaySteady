// MSW request handler for portfolio performance at a glance (nav map 6).

import { http, HttpResponse, type HttpHandler } from 'msw';

import { buildPortfolioPerformance, parseGenerated } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { PortfolioPerformanceSchema, ReportCurrencySchema } from '../../schemas';
import { portfolioValuation } from './portfolioValuation';

// The stale-data scenario holds valuations back three days, as if closing prices stopped arriving.
const STALE_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

export const performanceHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/portfolio/performance', ({ request }) => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load performance' }, { status: 500 });
    }
    const parsed = ReportCurrencySchema.safeParse(
      new URL(request.url).searchParams.get('currency'),
    );
    const currency = parsed.success ? parsed.data : 'USD';
    const result = buildPortfolioPerformance(
      portfolioValuation(),
      currency,
      new Date(Date.now() - (scenario === 'stale-data' ? STALE_DELAY_MS : 0))
        .toISOString()
        .slice(0, 10),
    );
    return HttpResponse.json(
      parseGenerated(PortfolioPerformanceSchema, result, 'portfolioPerformance'),
      { status: 200 },
    );
  }),
];
