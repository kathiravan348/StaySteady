// MSW request handlers for planning (UI spec 7.17). Values come from the same valuation as reports;
// trade costs from the broker, currency and instrument type configuration. Nothing here orders.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  buildAllocationView,
  buildGoalView,
  buildProjection,
  buildTradePreview,
  currentPortfolioValue,
  parseGenerated,
  parseGeneratedList,
} from '../generators';
import type { CostConfig } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  currentConfigs,
  getBaseCurrencyVersions,
  getBrokerVersions,
  getCurrencyVersions,
  getInstrumentTypeVersions,
} from '../stores/configStore';
import { getGoals, getPlan, setGoals, setPlan } from '../stores/planningStore';
import type { ReportCurrencyDto } from '../../schemas';
import {
  AllocationViewSchema,
  GoalSchema,
  GoalViewSchema,
  ProjectionRequestSchema,
  ProjectionSchema,
  ReportCurrencySchema,
  SaveAllocationPlanSchema,
  TradePreviewRequestSchema,
  TradePreviewSchema,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';
import { portfolioValuation } from './portfolioValuation';

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });
const loadError = (what: string): Response | null =>
  getActiveDeveloperScenario() === 'loading-error' ? failure(`Failed to load ${what}`, 500) : null;
const today = (): string => new Date().toISOString().slice(0, 10);

function currencyFrom(request: Request): ReportCurrencyDto {
  const parsed = ReportCurrencySchema.safeParse(new URL(request.url).searchParams.get('currency'));
  if (parsed.success) return parsed.data;
  const base = ReportCurrencySchema.safeParse(
    getBaseCurrencyVersions().get('base')?.[0]?.snapshot.currency,
  );
  return base.success ? base.data : 'USD';
}

const costs = (): CostConfig => ({
  brokers: currentConfigs(getBrokerVersions()),
  currencies: currentConfigs(getCurrencyVersions()),
});

const firstIssue = (error: { issues: readonly { message: string }[] }): string =>
  error.issues[0]?.message ?? 'Invalid request';

function allocationResponse(currency: ReportCurrencyDto): Response {
  const saved = getPlan();
  const view = buildAllocationView(
    portfolioValuation(),
    saved.plan,
    saved,
    currency,
    today(),
    costs(),
  );
  return HttpResponse.json(parseGenerated(AllocationViewSchema, view, 'allocationView'), {
    status: 200,
  });
}

function goalsResponse(): Response {
  const v = portfolioValuation();
  return HttpResponse.json(
    parseGeneratedList(
      GoalViewSchema,
      getGoals().map((goal) => buildGoalView(goal, v, today())),
      'goalViews',
    ),
    { status: 200 },
  );
}

async function readGoal(
  request: Request,
  id: string,
): Promise<Response | ReturnType<typeof getGoals>[number]> {
  const body: unknown = await request.json().catch(() => null);
  const candidate = typeof body === 'object' && body !== null ? { ...body, id } : body;
  const parsed = GoalSchema.safeParse(candidate);
  if (!parsed.success) return failure(firstIssue(parsed.error), 400);
  const v = portfolioValuation();
  const held = new Set(v.holdings.map((holding) => String(holding.instrumentId)));
  const unknown = parsed.data.linkedInstrumentIds.filter((item) => !held.has(item));
  if (unknown.length > 0) return failure('A goal can only link holdings that are held', 400);
  return { ...parsed.data, id, linkedInstrumentIds: [...parsed.data.linkedInstrumentIds] };
}

export const planningHandlers: readonly HttpHandler[] = [
  http.get(
    '/api/v1/planning/allocation',
    ({ request }) => loadError('allocation') ?? allocationResponse(currencyFrom(request)),
  ),

  http.put('/api/v1/planning/allocation', async ({ request }) => {
    const parsed = SaveAllocationPlanSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    setPlan({ plan: parsed.data.plan, savedAt: nowUtc(), reason: parsed.data.reason });
    return allocationResponse(currencyFrom(request));
  }),

  http.get('/api/v1/planning/goals', () => loadError('goals') ?? goalsResponse()),

  http.post('/api/v1/planning/goals', async ({ request }) => {
    const goal = await readGoal(request, `goal-${String(Date.now())}`);
    if (goal instanceof Response) return goal;
    setGoals([...getGoals(), goal]);
    return goalsResponse();
  }),

  http.put('/api/v1/planning/goals/:id', async ({ params, request }) => {
    const id = String(params['id']);
    if (!getGoals().some((item) => item.id === id)) return failure('Goal not found', 404);
    const goal = await readGoal(request, id);
    if (goal instanceof Response) return goal;
    setGoals(getGoals().map((item) => (item.id === id ? goal : item)));
    return goalsResponse();
  }),

  http.delete('/api/v1/planning/goals/:id', ({ params }) => {
    const id = String(params['id']);
    if (!getGoals().some((item) => item.id === id)) return failure('Goal not found', 404);
    setGoals(getGoals().filter((item) => item.id !== id));
    return goalsResponse();
  }),

  http.post('/api/v1/planning/projection', async ({ request }) => {
    const failed = loadError('the projection');
    if (failed !== null) return failed;
    const parsed = ProjectionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const start = currentPortfolioValue(portfolioValuation(), parsed.data.currency, today());
    return HttpResponse.json(
      parseGenerated(ProjectionSchema, buildProjection(parsed.data, start, today()), 'projection'),
      { status: 200 },
    );
  }),

  http.post('/api/v1/planning/trade-preview', async ({ request }) => {
    const failed = loadError('the trade preview');
    if (failed !== null) return failed;
    const parsed = TradePreviewRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const preview = buildTradePreview(parsed.data, portfolioValuation(), getPlan().plan, today(), {
      ...costs(),
      instrumentTypes: currentConfigs(getInstrumentTypeVersions()),
    });
    if (typeof preview === 'string') return failure(preview, 400);
    return HttpResponse.json(parseGenerated(TradePreviewSchema, preview, 'tradePreview'), {
      status: 200,
    });
  }),
];
