// MSW request handlers for instrument fundamentals and watchlists (UI spec 7.4, 7.5).
// Watchlist edits live in memory for the page session, like a real API would persist them.

import { http, HttpResponse, type HttpHandler } from 'msw';

import type { WatchlistDto } from '../../schemas';
import {
  CreateWatchlistRequestSchema,
  MoveWatchlistItemRequestSchema,
  UpdateWatchlistRequestSchema,
  WatchlistSchema,
} from '../../schemas';
import {
  createMockGeneratorContext,
  generateInstrumentFundamentals,
  generateWatchlists,
  getCanonicalInstruments,
  parseGenerated,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();
const knownInstrumentIds = new Set(
  getCanonicalInstruments().map((instrument) => String(instrument.id)),
);
let watchlists: WatchlistDto[] = [...generateWatchlists()];

function failure(message: string): Response | null {
  return getActiveDeveloperScenario() === 'loading-error'
    ? HttpResponse.json({ error: message }, { status: 500 })
    : null;
}

const problem = (status: number, error: string): Response =>
  HttpResponse.json({ error }, { status });

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const nameTaken = (name: string, exceptId?: string): boolean =>
  watchlists.some((list) => list.id !== exceptId && list.name.toLowerCase() === name.toLowerCase());

export const researchDataHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/watchlists', () => {
    return failure('Failed to load watchlists') ?? HttpResponse.json(watchlists);
  }),

  http.post('/api/v1/watchlists', async ({ request }) => {
    const failed = failure('Failed to create watchlist');
    if (failed !== null) return failed;
    const parsed = CreateWatchlistRequestSchema.safeParse(await readBody(request));
    if (!parsed.success)
      return problem(400, parsed.error.issues[0]?.message ?? 'Invalid watchlist');
    if (nameTaken(parsed.data.name))
      return problem(409, 'A watchlist with this name already exists');
    const created = parseGenerated(
      WatchlistSchema,
      {
        id: `wl-${crypto.randomUUID()}`,
        name: parsed.data.name,
        instrumentIds: [],
        createdAt: new Date().toISOString(),
      },
      'watchlist',
    );
    watchlists = [...watchlists, created];
    return HttpResponse.json(watchlists, { status: 201 });
  }),

  http.patch('/api/v1/watchlists/:id', async ({ params, request }) => {
    const failed = failure('Failed to update watchlist');
    if (failed !== null) return failed;
    const id = String(params['id']);
    const existing = watchlists.find((list) => list.id === id);
    if (existing === undefined) return problem(404, 'Watchlist not found');
    const parsed = UpdateWatchlistRequestSchema.safeParse(await readBody(request));
    if (!parsed.success) return problem(400, parsed.error.issues[0]?.message ?? 'Invalid update');
    const { name, instrumentIds } = parsed.data;
    if (name !== undefined && nameTaken(name, id)) {
      return problem(409, 'A watchlist with this name already exists');
    }
    if (instrumentIds !== undefined) {
      if (instrumentIds.some((instrumentId) => !knownInstrumentIds.has(instrumentId))) {
        return problem(400, 'Unknown instrument');
      }
      if (new Set(instrumentIds).size !== instrumentIds.length) {
        return problem(400, 'An instrument appears twice in the list');
      }
    }
    watchlists = watchlists.map((list) =>
      list.id === id
        ? {
            ...list,
            ...(name === undefined ? {} : { name }),
            ...(instrumentIds === undefined ? {} : { instrumentIds }),
          }
        : list,
    );
    return HttpResponse.json(watchlists);
  }),

  http.delete('/api/v1/watchlists/:id', ({ params }) => {
    const failed = failure('Failed to delete watchlist');
    if (failed !== null) return failed;
    const id = String(params['id']);
    if (!watchlists.some((list) => list.id === id)) return problem(404, 'Watchlist not found');
    watchlists = watchlists.filter((list) => list.id !== id);
    return HttpResponse.json(watchlists);
  }),

  http.post('/api/v1/watchlists/move', async ({ request }) => {
    const failed = failure('Failed to move instrument');
    if (failed !== null) return failed;
    const parsed = MoveWatchlistItemRequestSchema.safeParse(await readBody(request));
    if (!parsed.success) return problem(400, parsed.error.issues[0]?.message ?? 'Invalid move');
    const { instrumentId, fromWatchlistId, toWatchlistId } = parsed.data;
    const from = watchlists.find((list) => list.id === fromWatchlistId);
    const to = watchlists.find((list) => list.id === toWatchlistId);
    if (from === undefined || to === undefined) return problem(404, 'Watchlist not found');
    if (!from.instrumentIds.includes(instrumentId)) {
      return problem(400, 'The instrument is not in that watchlist');
    }
    watchlists = watchlists.map((list) => {
      if (list.id === from.id && from.id !== to.id) {
        return {
          ...list,
          instrumentIds: list.instrumentIds.filter((item) => item !== instrumentId),
        };
      }
      if (list.id === to.id && !list.instrumentIds.includes(instrumentId)) {
        return { ...list, instrumentIds: [...list.instrumentIds, instrumentId] };
      }
      return list;
    });
    return HttpResponse.json(watchlists);
  }),

  http.get('/api/v1/instruments/:id/fundamentals', ({ params }) => {
    const fundamentals = generateInstrumentFundamentals(ctx, String(params['id']));
    if (fundamentals === null) {
      return HttpResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }
    return failure('Failed to load fundamentals') ?? HttpResponse.json(fundamentals);
  }),
];
