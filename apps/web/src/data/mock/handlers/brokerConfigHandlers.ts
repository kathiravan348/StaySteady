// MSW request handlers for broker configuration (UI spec 7.18), following the provider handlers: every
// write validates with the form's schema, keeps a full version and returns the whole list. No handler
// here places, changes or cancels an order.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  brokerConfigHealth,
  parseGenerated,
  parseGeneratedList,
  testBrokerConnection,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { appendBrokerVersion, getBrokerVersions, getMarketVersions } from '../stores/configStore';
import type { BrokerConfigInput } from '../../schemas';
import {
  BrokerConfigEntrySchema,
  ConnectionTestResultSchema,
  RevertRequestSchema,
  SaveBrokerConfigRequestSchema,
  TestBrokerConnectionRequestSchema,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

function brokerEntries(): Response {
  const scenario = getActiveDeveloperScenario();
  const entries = [...getBrokerVersions().values()].flatMap((versions) => {
    const config = versions[0]?.snapshot;
    return config === undefined
      ? []
      : [{ config, health: brokerConfigHealth(config, scenario), versions }];
  });
  return HttpResponse.json(
    parseGeneratedList(BrokerConfigEntrySchema, entries, 'BrokerConfigEntry'),
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

async function readSave(
  request: Request,
): Promise<{ config: BrokerConfigInput; reason: string } | Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = SaveBrokerConfigRequestSchema.safeParse(body);
  if (!parsed.success) return failure(firstIssue(parsed.error), 400);
  // Keep the submitted input shape, which is what versions store.
  const raw = body as { config: BrokerConfigInput };
  // Markets must be configured ones; the check needs the market list, so it lives here.
  const known = getMarketVersions();
  const unknown = raw.config.markets.filter((market) => !known.has(market));
  if (unknown.length > 0) return failure(`Unknown market: ${unknown.join(', ')}`, 400);
  return { config: raw.config, reason: parsed.data.reason };
}

const sameConfig = (a: BrokerConfigInput, b: BrokerConfigInput): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const brokerConfigHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/config/brokers', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load broker configuration', 500);
    }
    return brokerEntries();
  }),

  // A new broker always starts in simulation, whatever the form sent.
  http.post('/api/v1/config/brokers', async ({ request }) => {
    const save = await readSave(request);
    if (save instanceof Response) return save;
    if (getBrokerVersions().has(save.config.brokerId)) {
      return failure(`A broker with the id ${save.config.brokerId} already exists`, 409);
    }
    appendBrokerVersion(
      save.config.brokerId,
      { ...save.config, mode: 'simulation' },
      save.reason,
      nowUtc(),
    );
    return brokerEntries();
  }),

  // Read-only: credential, session and account read. Tests the form as sent, saved or not.
  http.post('/api/v1/config/brokers/test', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const parsed = TestBrokerConnectionRequestSchema.safeParse(body);
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const raw = body as { config: BrokerConfigInput };
    if (raw.config.connection === 'manual') {
      return failure('A manual broker has no connection to test', 400);
    }
    const outcome = testBrokerConnection(raw.config, getActiveDeveloperScenario());
    return HttpResponse.json(
      parseGenerated(
        ConnectionTestResultSchema,
        { testedAt: nowUtc(), ...outcome, checks: [...outcome.checks] },
        'ConnectionTest',
      ),
      { status: 200 },
    );
  }),

  http.put('/api/v1/config/brokers/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const existing = getBrokerVersions().get(id)?.[0]?.snapshot;
    if (existing === undefined) return failure('Broker not found', 404);
    const save = await readSave(request);
    if (save instanceof Response) return save;
    if (save.config.brokerId !== id) return failure('A broker id cannot be changed', 400);
    if (sameConfig(existing, save.config)) {
      return failure('Nothing has changed since the current version', 400);
    }
    appendBrokerVersion(id, save.config, save.reason, nowUtc());
    return brokerEntries();
  }),

  // Reverting saves the old snapshot as a new version, so the history itself is never rewritten.
  http.post('/api/v1/config/brokers/:id/revert', async ({ params, request }) => {
    const id = params['id'] as string;
    const versions = getBrokerVersions().get(id);
    if (versions === undefined) return failure('Broker not found', 404);
    const parsed = RevertRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Invalid revert', 400);
    const target = versions.find((item) => item.version === parsed.data.version);
    if (target === undefined) return failure('That version does not exist', 404);
    const existing = versions[0]?.snapshot;
    if (existing !== undefined && sameConfig(existing, target.snapshot)) {
      return failure('The current configuration already matches that version', 400);
    }
    appendBrokerVersion(
      id,
      target.snapshot,
      `Reverted to version ${String(target.version)}. ${parsed.data.reason}`,
      nowUtc(),
    );
    return brokerEntries();
  }),
];
