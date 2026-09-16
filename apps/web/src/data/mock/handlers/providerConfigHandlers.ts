// MSW request handlers for data provider configuration (UI spec 7.18), following the market handlers:
// every write validates with the form's schema, keeps a full version and returns the whole list.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  parseGenerated,
  parseGeneratedList,
  providerConfigHealth,
  testProviderConnection,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  appendProviderVersion,
  getMarketVersions,
  getProviderVersions,
} from '../stores/configStore';
import type { ProviderConfigInput } from '../../schemas';
import {
  ConnectionTestResultSchema,
  ProviderConfigEntrySchema,
  RevertRequestSchema,
  SaveProviderConfigRequestSchema,
  TestProviderConnectionRequestSchema,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

const current = (id: string): ProviderConfigInput | undefined =>
  getProviderVersions().get(id)?.[0]?.snapshot;

function providerEntries(): Response {
  const scenario = getActiveDeveloperScenario();
  const configs = [...getProviderVersions().values()].flatMap((versions) =>
    versions[0] === undefined ? [] : [versions[0].snapshot],
  );
  const entries = [...getProviderVersions().values()].flatMap((versions) => {
    const config = versions[0]?.snapshot;
    return config === undefined
      ? []
      : [{ config, health: providerConfigHealth(config, configs, scenario), versions }];
  });
  return HttpResponse.json(
    parseGeneratedList(ProviderConfigEntrySchema, entries, 'ProviderConfigEntry'),
    { status: 200 },
  );
}

const firstIssue = (error: {
  issues: readonly { message: string; path: PropertyKey[] }[];
}): string => {
  const issue = error.issues[0];
  const where =
    issue === undefined || issue.path.length === 0 ? '' : ` (${issue.path.map(String).join('.')})`;
  return `${issue?.message ?? 'Invalid configuration'}${where}`;
};

// Coverage must name markets that are configured; the check needs the market list, so it lives here
// rather than in the provider schema.
function unknownMarkets(config: ProviderConfigInput): readonly string[] {
  const known = getMarketVersions();
  return config.coverage.markets.filter((market) => !known.has(market));
}

async function readSave(
  request: Request,
): Promise<{ config: ProviderConfigInput; reason: string } | Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = SaveProviderConfigRequestSchema.safeParse(body);
  if (!parsed.success) return failure(firstIssue(parsed.error), 400);
  // Keep the submitted input shape, which is what versions store.
  const raw = body as { config: ProviderConfigInput };
  const unknown = unknownMarkets(raw.config);
  if (unknown.length > 0) return failure(`Unknown market: ${unknown.join(', ')}`, 400);
  return { config: raw.config, reason: parsed.data.reason };
}

const sameConfig = (a: ProviderConfigInput, b: ProviderConfigInput): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const providerConfigHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/config/providers', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load provider configuration', 500);
    }
    return providerEntries();
  }),

  // A new provider always starts in simulation, whatever the form sent.
  http.post('/api/v1/config/providers', async ({ request }) => {
    const save = await readSave(request);
    if (save instanceof Response) return save;
    if (getProviderVersions().has(save.config.providerId)) {
      return failure(`A provider with the id ${save.config.providerId} already exists`, 409);
    }
    appendProviderVersion(
      save.config.providerId,
      { ...save.config, mode: 'simulation' },
      save.reason,
      nowUtc(),
    );
    return providerEntries();
  }),

  // Tests the configuration as sent, so an unsaved draft can be checked before it is saved.
  http.post('/api/v1/config/providers/test', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const parsed = TestProviderConnectionRequestSchema.safeParse(body);
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const raw = body as { config: ProviderConfigInput };
    const outcome = testProviderConnection(raw.config, getActiveDeveloperScenario());
    return HttpResponse.json(
      parseGenerated(
        ConnectionTestResultSchema,
        { testedAt: nowUtc(), ...outcome, checks: [...outcome.checks] },
        'ConnectionTest',
      ),
      { status: 200 },
    );
  }),

  http.put('/api/v1/config/providers/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const existing = current(id);
    if (existing === undefined) return failure('Provider not found', 404);
    const save = await readSave(request);
    if (save instanceof Response) return save;
    if (save.config.providerId !== id) return failure('A provider id cannot be changed', 400);
    if (sameConfig(existing, save.config)) {
      return failure('Nothing has changed since the current version', 400);
    }
    appendProviderVersion(id, save.config, save.reason, nowUtc());
    return providerEntries();
  }),

  // Reverting saves the old snapshot as a new version, so the history itself is never rewritten.
  http.post('/api/v1/config/providers/:id/revert', async ({ params, request }) => {
    const id = params['id'] as string;
    const versions = getProviderVersions().get(id);
    if (versions === undefined) return failure('Provider not found', 404);
    const parsed = RevertRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Invalid revert', 400);
    const target = versions.find((item) => item.version === parsed.data.version);
    if (target === undefined) return failure('That version does not exist', 404);
    const existing = versions[0]?.snapshot;
    if (existing !== undefined && sameConfig(existing, target.snapshot)) {
      return failure('The current configuration already matches that version', 400);
    }
    appendProviderVersion(
      id,
      target.snapshot,
      `Reverted to version ${String(target.version)}. ${parsed.data.reason}`,
      nowUtc(),
    );
    return providerEntries();
  }),
];
