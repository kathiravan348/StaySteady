// MSW request handlers for configuration (UI spec 7.18). Every write validates with the same schema
// the form uses, keeps a full version, and returns the whole list (decision 33).

import { http, HttpResponse, type HttpHandler } from 'msw';

import { marketConfigHealth, parseGeneratedList } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { appendMarketVersion, getMarketVersions } from '../stores/configStore';
import type { MarketConfigInput } from '../../schemas';
import {
  MarketConfigEntrySchema,
  RevertRequestSchema,
  SaveMarketConfigRequestSchema,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

function marketEntries(): Response {
  const nowMs = Date.now();
  const entries = [...getMarketVersions().values()].map((versions) => {
    const current = versions[0]?.snapshot as MarketConfigInput;
    return { config: current, health: marketConfigHealth(current, nowMs), versions };
  });
  return HttpResponse.json(
    parseGeneratedList(MarketConfigEntrySchema, entries, 'MarketConfigEntry'),
    { status: 200 },
  );
}

async function readSave(
  request: Request,
): Promise<{ config: MarketConfigInput; reason: string } | Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = SaveMarketConfigRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where =
      issue === undefined || issue.path.length === 0 ? '' : ` (${issue.path.join('.')})`;
    return failure(`${issue?.message ?? 'Invalid configuration'}${where}`, 400);
  }
  // Keep the submitted input shape, which is what versions store.
  const raw = body as { config: MarketConfigInput };
  return { config: raw.config, reason: parsed.data.reason };
}

const sameConfig = (a: MarketConfigInput, b: MarketConfigInput): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const configHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/config/markets', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load market configuration', 500);
    }
    return marketEntries();
  }),

  // A new market always starts in simulation, whatever the form sent.
  http.post('/api/v1/config/markets', async ({ request }) => {
    const save = await readSave(request);
    if (save instanceof Response) return save;
    if (getMarketVersions().has(save.config.marketId)) {
      return failure(`A market with the code ${save.config.marketId} already exists`, 409);
    }
    appendMarketVersion(
      save.config.marketId,
      { ...save.config, mode: 'simulation' },
      save.reason,
      nowUtc(),
    );
    return marketEntries();
  }),

  http.put('/api/v1/config/markets/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const versions = getMarketVersions().get(id);
    if (versions === undefined) return failure('Market not found', 404);
    const save = await readSave(request);
    if (save instanceof Response) return save;
    if (save.config.marketId !== id) return failure('A market code cannot be changed', 400);
    const current = versions[0]?.snapshot;
    if (current !== undefined && sameConfig(current, save.config)) {
      return failure('Nothing has changed since the current version', 400);
    }
    appendMarketVersion(id, save.config, save.reason, nowUtc());
    return marketEntries();
  }),

  // Reverting saves the old snapshot as a new version, so the history itself is never rewritten.
  http.post('/api/v1/config/markets/:id/revert', async ({ params, request }) => {
    const id = params['id'] as string;
    const versions = getMarketVersions().get(id);
    if (versions === undefined) return failure('Market not found', 404);
    const parsed = RevertRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message ?? 'Invalid revert', 400);
    }
    const target = versions.find((item) => item.version === parsed.data.version);
    if (target === undefined) return failure('That version does not exist', 404);
    const current = versions[0]?.snapshot;
    if (current !== undefined && sameConfig(current, target.snapshot)) {
      return failure('The current configuration already matches that version', 400);
    }
    appendMarketVersion(
      id,
      target.snapshot,
      `Reverted to version ${String(target.version)}. ${parsed.data.reason}`,
      nowUtc(),
    );
    return marketEntries();
  }),
];
