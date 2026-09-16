// MSW request handlers for reports (UI spec 7.16): on-demand reports computed from the portfolio
// record, and scheduled reports with their delivery history.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  PRICE_HISTORY_ORIGIN_DATE,
  buildReport,
  createMockGeneratorContext,
  createValuationContext,
  generatePortfolioData,
  generateStrategies,
  lastCompletePeriod,
  liveTicker,
  nextRunDate,
  parseGenerated,
  parseGeneratedList,
} from '../generators';
import { ALERT_CHANNELS, TEST_OUTCOMES } from '../generators/healthHistoryData';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { currentConfigs, getMarketVersions } from '../stores/configStore';
import { addRun, getRuns, getSchedules, setSchedules } from '../stores/reportStore';
import {
  CreateScheduledReportSchema,
  ReportComparisonSchema,
  ReportCurrencySchema,
  ReportRunSchema,
  ReportSchema,
  ReportTypeSchema,
  ScheduledReportSchema,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

const ctx = createMockGeneratorContext();
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

const loadError = (what: string): Response | null =>
  getActiveDeveloperScenario() === 'loading-error' ? failure(`Failed to load ${what}`, 500) : null;

const today = (): string => new Date().toISOString().slice(0, 10);

function valuation(): ReturnType<typeof createValuationContext> {
  const quotes = liveTicker.getQuotes();
  const bundle = generatePortfolioData(
    ctx,
    getActiveDeveloperScenario() === 'empty-portfolio',
    quotes.length > 0 ? quotes : undefined,
  );
  const strategies = new Map(generateStrategies(ctx).map((item) => [String(item.id), item.name]));
  return createValuationContext(
    ctx,
    bundle.holdings,
    bundle.transactions,
    currentConfigs(getMarketVersions()),
    strategies,
  );
}

const schedulesResponse = (): Response =>
  HttpResponse.json(parseGeneratedList(ScheduledReportSchema, getSchedules(), 'reportSchedules'), {
    status: 200,
  });

export const reportHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/reports', ({ request }) => {
    const failed = loadError('the report');
    if (failed !== null) return failed;
    const params = new URL(request.url).searchParams;
    const type = ReportTypeSchema.safeParse(params.get('type'));
    const currency = ReportCurrencySchema.safeParse(params.get('currency'));
    const comparison = ReportComparisonSchema.safeParse(params.get('comparison') ?? 'none');
    const from = params.get('from') ?? '';
    const to = params.get('to') ?? '';
    if (!type.success || !currency.success || !comparison.success) {
      return failure('Choose a report type, currency and comparison', 400);
    }
    if (!DATE.test(from) || !DATE.test(to)) return failure('Choose a start and end date', 400);
    if (from > to) return failure('The start date must be on or before the end date', 400);
    if (to > today()) return failure('A report cannot end in the future', 400);
    if (from < String(PRICE_HISTORY_ORIGIN_DATE)) {
      return failure(
        `Price history starts on ${String(PRICE_HISTORY_ORIGIN_DATE)}; choose a later start`,
        400,
      );
    }
    const report = buildReport(
      { type: type.data, from, to, currency: currency.data, comparison: comparison.data },
      valuation(),
      nowUtc(),
    );
    return HttpResponse.json(parseGenerated(ReportSchema, report, 'report'), { status: 200 });
  }),

  http.get(
    '/api/v1/reports/schedules',
    () => loadError('scheduled reports') ?? schedulesResponse(),
  ),

  http.post('/api/v1/reports/schedules', async ({ request }) => {
    const parsed = CreateScheduledReportSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Invalid schedule', 400);
    if (!ALERT_CHANNELS.some((channel) => channel.id === parsed.data.channelId)) {
      return failure('Unknown delivery channel', 400);
    }
    const id = `sch-${parsed.data.type}-${parsed.data.frequency}-${String(Date.now())}`;
    setSchedules([
      ...getSchedules(),
      {
        ...parsed.data,
        id,
        enabled: true,
        nextRunAt: nextRunDate(parsed.data.frequency, today()),
        lastRunAt: null,
      },
    ]);
    return schedulesResponse();
  }),

  http.patch('/api/v1/reports/schedules/:id', async ({ params, request }) => {
    const id = String(params['id']);
    const body: unknown = await request.json().catch(() => null);
    const enabled =
      typeof body === 'object' && body !== null && 'enabled' in body ? body.enabled : undefined;
    if (typeof enabled !== 'boolean') return failure('Say whether the schedule is enabled', 400);
    if (!getSchedules().some((item) => item.id === id)) return failure('Schedule not found', 404);
    setSchedules(getSchedules().map((item) => (item.id === id ? { ...item, enabled } : item)));
    return schedulesResponse();
  }),

  http.delete('/api/v1/reports/schedules/:id', ({ params }) => {
    const id = String(params['id']);
    if (!getSchedules().some((item) => item.id === id)) return failure('Schedule not found', 404);
    setSchedules(getSchedules().filter((item) => item.id !== id));
    return schedulesResponse();
  }),

  // Delivery follows the channel's test outcome on System Health, so the webhook fails here too.
  http.post('/api/v1/reports/schedules/:id/run', ({ params }) => {
    const schedule = getSchedules().find((item) => item.id === String(params['id']));
    if (schedule === undefined) return failure('Schedule not found', 404);
    const channel = ALERT_CHANNELS.find((item) => item.id === schedule.channelId);
    const outcome =
      channel === undefined
        ? { result: 'failed' as const, detail: 'Channel not found' }
        : TEST_OUTCOMES[channel.kind];
    const generatedAt = nowUtc();
    addRun({
      id: `run-${String(Date.now())}`,
      scheduleId: schedule.id,
      type: schedule.type,
      period: lastCompletePeriod(schedule.frequency, today()),
      currency: schedule.currency,
      channelId: schedule.channelId,
      generatedAt,
      status: outcome.result === 'passed' ? 'delivered' : 'failed',
      detail: outcome.detail,
    });
    setSchedules(
      getSchedules().map((item) =>
        item.id === schedule.id ? { ...item, lastRunAt: generatedAt } : item,
      ),
    );
    return schedulesResponse();
  }),

  http.get(
    '/api/v1/reports/runs',
    () =>
      loadError('report history') ??
      HttpResponse.json(parseGeneratedList(ReportRunSchema, getRuns(), 'reportRuns'), {
        status: 200,
      }),
  ),
];
