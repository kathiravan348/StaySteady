// MSW handlers for instrument type, currency and alert rule configuration (UI spec 7.18), built on the
// versioned configuration factory. Rules that need another area's data are checked here.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  alertRuleConfigHealth,
  currencyConfigHealth,
  instrumentTypeConfigHealth,
  parseGenerated,
  testAlertRule,
} from '../generators';
import { ALERT_CHANNELS } from '../generators/healthHistoryData';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  appendVersion,
  currentConfigs,
  getAlertRuleVersions,
  getBaseCurrencyVersions,
  getBrokerVersions,
  getCurrencyVersions,
  getInstrumentTypeVersions,
  getMarketVersions,
  getProviderVersions,
} from '../stores/configStore';
import type {
  AlertRuleConfigInput,
  BaseCurrencyConfigInput,
  CurrencyConfigInput,
  InstrumentTypeConfigInput,
} from '../../schemas';
import {
  AlertRuleConfigListSchema,
  BaseCurrencyEntrySchema,
  ConnectionTestResultSchema,
  CurrencyConfigListSchema,
  InstrumentTypeConfigListSchema,
  RevertRequestSchema,
  SaveAlertRuleConfigRequestSchema,
  SaveBaseCurrencyRequestSchema,
  SaveCurrencyConfigRequestSchema,
  SaveInstrumentTypeConfigRequestSchema,
  TestAlertRuleRequestSchema,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';
import { failure, firstIssue, versionedConfigHandlers } from './versionedConfigHandlers';

const withHealth = <T>(
  store: Map<string, { version: number; savedAt: string; reason: string; snapshot: T }[]>,
  health: (config: T) => unknown,
): unknown[] =>
  [...store.values()].flatMap((versions) => {
    const config = versions[0]?.snapshot;
    return config === undefined ? [] : [{ config, health: health(config), versions }];
  });

const baseCurrency = (): string =>
  getBaseCurrencyVersions().get('base')?.[0]?.snapshot.currency ?? 'USD';

const instrumentHandlers = versionedConfigHandlers<InstrumentTypeConfigInput>({
  path: '/api/v1/config/instruments',
  noun: 'Instrument type',
  idOf: (config) => config.type,
  store: getInstrumentTypeVersions,
  listSchema: InstrumentTypeConfigListSchema,
  saveSchema: SaveInstrumentTypeConfigRequestSchema,
  allowCreate: false,
  entries: () => {
    const markets = currentConfigs(getMarketVersions());
    const brokers = currentConfigs(getBrokerVersions());
    return withHealth(getInstrumentTypeVersions(), (config) =>
      instrumentTypeConfigHealth(config, markets, brokers),
    );
  },
  check: (config) => {
    const unknown = config.markets.filter((market) => !getMarketVersions().has(market));
    return unknown.length > 0 ? `Unknown market: ${unknown.join(', ')}` : null;
  },
});

const currencyHandlers = versionedConfigHandlers<CurrencyConfigInput>({
  path: '/api/v1/config/currencies',
  noun: 'Currency',
  idOf: (config) => config.currency,
  store: getCurrencyVersions,
  listSchema: CurrencyConfigListSchema,
  saveSchema: SaveCurrencyConfigRequestSchema,
  allowCreate: false,
  entries: () => {
    const providers = currentConfigs(getProviderVersions());
    const scenario = getActiveDeveloperScenario();
    const base = baseCurrency();
    return withHealth(getCurrencyVersions(), (config) =>
      currencyConfigHealth(config, providers, base, scenario),
    );
  },
  check: (config) => {
    if (!config.enabled && config.currency === baseCurrency()) {
      return `${config.currency} is the base currency; choose another base currency before disabling it`;
    }
    const known = getProviderVersions();
    const missing = [config.rateSourceId, config.fallbackSourceId].filter(
      (id): id is string => id !== null && !known.has(id),
    );
    return missing.length > 0 ? `Unknown data provider: ${missing.join(', ')}` : null;
  },
});

const alertHandlers = versionedConfigHandlers<AlertRuleConfigInput>({
  path: '/api/v1/config/alerts',
  noun: 'Alert rule',
  idOf: (config) => config.ruleId,
  store: getAlertRuleVersions,
  listSchema: AlertRuleConfigListSchema,
  saveSchema: SaveAlertRuleConfigRequestSchema,
  allowCreate: true,
  entries: () => withHealth(getAlertRuleVersions(), alertRuleConfigHealth),
  check: (config) => {
    const unknown = [...config.channels, ...config.escalation.channels].filter(
      (id) => !ALERT_CHANNELS.some((channel) => channel.id === id),
    );
    return unknown.length > 0 ? `Unknown channel: ${unknown.join(', ')}` : null;
  },
});

function baseEntry(): Response {
  const versions = getBaseCurrencyVersions().get('base') ?? [];
  const config = versions[0]?.snapshot;
  if (config === undefined) return failure('Base currency is not configured', 500);
  return HttpResponse.json(BaseCurrencyEntrySchema.parse({ config, versions }), { status: 200 });
}

// The base currency is one choice across all currencies, so it has its own endpoint and history.
const baseCurrencyHandlers: HttpHandler[] = [
  http.get('/api/v1/config/base-currency', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load the base currency', 500)
      : baseEntry(),
  ),

  http.put('/api/v1/config/base-currency', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const parsed = SaveBaseCurrencyRequestSchema.safeParse(body);
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const next: BaseCurrencyConfigInput = parsed.data.config;
    if (next.currency === baseCurrency()) {
      return failure(`${next.currency} is already the base currency`, 400);
    }
    const currency = getCurrencyVersions().get(next.currency)?.[0]?.snapshot;
    if (currency === undefined || !currency.enabled) {
      return failure(`Enable ${next.currency} before making it the base currency`, 400);
    }
    appendVersion(getBaseCurrencyVersions(), 'base', next, parsed.data.reason, nowUtc());
    return baseEntry();
  }),

  http.post('/api/v1/config/base-currency/revert', async ({ request }) => {
    const parsed = RevertRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const versions = getBaseCurrencyVersions().get('base') ?? [];
    const target = versions.find((item) => item.version === parsed.data.version);
    if (target === undefined) return failure('That version does not exist', 404);
    if (target.snapshot.currency === baseCurrency()) {
      return failure('The current configuration already matches that version', 400);
    }
    const currency = getCurrencyVersions().get(target.snapshot.currency)?.[0]?.snapshot;
    if (currency === undefined || !currency.enabled) {
      return failure(`Enable ${target.snapshot.currency} before making it the base currency`, 400);
    }
    appendVersion(
      getBaseCurrencyVersions(),
      'base',
      target.snapshot,
      `Reverted to version ${String(target.version)}. ${parsed.data.reason}`,
      nowUtc(),
    );
    return baseEntry();
  }),
];

// Mock only: nothing is sent. Tests the rule as it stands in the form, saved or not.
const alertTestHandler = http.post('/api/v1/config/alerts/test', async ({ request }) => {
  const body: unknown = await request.json().catch(() => null);
  const parsed = TestAlertRuleRequestSchema.safeParse(body);
  if (!parsed.success) return failure(firstIssue(parsed.error), 400);
  const outcome = testAlertRule(parsed.data.config);
  return HttpResponse.json(
    parseGenerated(
      ConnectionTestResultSchema,
      { testedAt: nowUtc(), ...outcome, checks: [...outcome.checks] },
      'AlertRuleTest',
    ),
    { status: 200 },
  );
});

export const settingsConfigHandlers: readonly HttpHandler[] = [
  ...instrumentHandlers,
  ...currencyHandlers,
  ...baseCurrencyHandlers,
  alertTestHandler,
  ...alertHandlers,
];
