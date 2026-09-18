// Strategy definitions created or saved in this browser session (T-01, decision 56). Seeded
// strategies stay generated; a save stores the new definition and its history on top. The store is
// mirrored to sessionStorage so a new strategy survives a reload but not a new tab.

import { z } from 'zod';

import type {
  CreateStrategyRequestDto,
  SavedStrategyDto,
  StrategyDraftDto,
  StrategyDto,
  StrategyVersionDto,
} from '../../schemas';
import { StrategyDraftSchema, StrategySchema, StrategyVersionSchema } from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';
import { toStrategyId } from '../../../shared/types/identifiers';
import {
  generateStrategies,
  generateStrategyDraft,
  generateStrategyTemplates,
  generateStrategyVersions,
} from '../generators';
import { tradingContext as ctx } from './tradingStore';

const STORAGE_KEY = 'staysteady.mock.strategies';
const FIRST_VERSION = '0.1.0';

const SavedEntrySchema = z.object({
  draft: StrategyDraftSchema,
  versions: z.array(StrategyVersionSchema),
});
type SavedEntry = z.infer<typeof SavedEntrySchema>;

const SnapshotSchema = z.object({
  created: z.array(StrategySchema),
  saved: z.record(z.string(), SavedEntrySchema),
});
type Snapshot = z.infer<typeof SnapshotSchema>;

let snapshot: Snapshot | null = null;

function state(): Snapshot {
  if (snapshot !== null) return snapshot;
  snapshot = { created: [], saved: {} };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? null : SnapshotSchema.safeParse(JSON.parse(raw));
    if (parsed?.success === true) snapshot = parsed.data;
  } catch {
    // Unreadable or unavailable storage: start from the seeded strategies only.
  }
  return snapshot;
}

function persist(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state()));
  } catch {
    // Storage unavailable: changes last until the page is reloaded.
  }
}

// A saved definition is what the rest of the app sees: name, version, timeframe and universe.
function withSaved(strategy: StrategyDto): StrategyDto {
  const draft = state().saved[String(strategy.id)]?.draft;
  if (draft === undefined) return strategy;
  return {
    ...strategy,
    name: draft.name,
    description: draft.description,
    version: draft.version,
    timeframe: draft.timeframe,
    universe: [...draft.scope.instrumentIds],
    updatedAt: draft.updatedAt,
  };
}

export function listStrategies(): readonly StrategyDto[] {
  return [...generateStrategies(ctx), ...state().created].map(withSaved);
}

export function findDraft(strategyId: string): StrategyDraftDto | undefined {
  return state().saved[strategyId]?.draft ?? generateStrategyDraft(ctx, strategyId);
}

export function listVersions(strategyId: string): readonly StrategyVersionDto[] {
  return state().saved[strategyId]?.versions ?? generateStrategyVersions(ctx, strategyId);
}

function nameTaken(name: string, exceptId: string | null): boolean {
  const wanted = name.trim().toLowerCase();
  return listStrategies().some(
    (strategy) => String(strategy.id) !== exceptId && strategy.name.trim().toLowerCase() === wanted,
  );
}

// Minor version up, patch reset: 2.1.0 becomes 2.2.0. Anything unparseable gains a ".1".
export function nextVersion(version: string): string {
  const parts = version.split('.').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    return `${version}.1`;
  }
  return `${String(parts[0])}.${String((parts[1] ?? 0) + 1)}.0`;
}

function nextId(): string {
  const taken = new Set(listStrategies().map((strategy) => String(strategy.id)));
  let n = state().created.length + 1;
  while (taken.has(`strat-user-${String(n)}`)) n += 1;
  return `strat-user-${String(n)}`;
}

// Everything in a definition except identity, naming, stage and version.
type Body = Omit<
  StrategyDraftDto,
  'strategyId' | 'name' | 'description' | 'version' | 'stage' | 'updatedAt'
>;

const BLANK: Body = {
  timeframe: '1d',
  scope: { marketIds: [], instrumentTypes: [], instrumentIds: [] },
  entry: { id: 'e-root', node: 'group', combinator: 'all', children: [] },
  exit: { id: 'x-root', node: 'group', combinator: 'any', children: [] },
  forcedExit: { maxLossPercent: 8, maxHoldingDays: 60, trailingStopPercent: null },
  sizing: { method: 'percent_of_capital', value: 10, maxPositionPercent: 15 },
  allocation: { maxCapitalPercent: 25, maxConcurrentPositions: 4 },
  holdingPeriod: { expectedDays: 20, minDays: 1, maxDays: 60 },
  news: {
    isEnabled: false,
    blockAroundHighImpactEvents: false,
    blockWindowHours: 24,
    minimumSentiment: null,
  },
  risk: { maxDailyLossPercent: null, maxLeverage: null },
};

function bodyFor(source: CreateStrategyRequestDto['source']): Body | string {
  if (source.kind === 'blank') return BLANK;
  if (source.kind === 'template') {
    const template = generateStrategyTemplates().find((item) => item.id === source.templateId);
    if (template === undefined) return `No template has the id "${source.templateId}".`;
    const { timeframe, entry, exit, forcedExit, sizing, allocation, holdingPeriod } = template;
    return { ...BLANK, timeframe, entry, exit, forcedExit, sizing, allocation, holdingPeriod };
  }
  const original = findDraft(String(source.strategyId));
  if (original === undefined) return `No strategy has the id "${String(source.strategyId)}".`;
  return original;
}

function describeOrigin(source: CreateStrategyRequestDto['source']): string {
  if (source.kind === 'blank') return 'Started blank.';
  if (source.kind === 'template') {
    const template = generateStrategyTemplates().find((item) => item.id === source.templateId);
    return `Started from the ${template?.name ?? source.templateId} template.`;
  }
  const original = listStrategies().find((item) => item.id === source.strategyId);
  return `Copied from ${original?.name ?? String(source.strategyId)} v${original?.version ?? '?'}.`;
}

// A new strategy always starts as a draft at 0.1.0, whatever it was copied from.
export function createStrategy(request: CreateStrategyRequestDto): StrategyDraftDto | string {
  if (nameTaken(request.name, null)) return `A strategy called "${request.name}" already exists.`;
  const body = bodyFor(request.source);
  if (typeof body === 'string') return body;

  const now = nowUtc();
  const id = toStrategyId(nextId());
  const draft: StrategyDraftDto = {
    ...body,
    strategyId: id,
    name: request.name,
    description: request.description,
    version: FIRST_VERSION,
    stage: 'draft',
    updatedAt: now,
  };
  const origin = describeOrigin(request.source);
  const current = state();
  current.created.push({
    id,
    name: request.name,
    description: request.description,
    version: FIRST_VERSION,
    stage: 'draft',
    universe: [...draft.scope.instrumentIds],
    timeframe: draft.timeframe,
    parameters: {},
    createdAt: now,
    updatedAt: now,
  });
  current.saved[String(id)] = {
    draft,
    versions: [{ version: FIRST_VERSION, savedAt: now, summary: origin, draft }],
  };
  persist();
  return draft;
}

// The server owns identity, stage and numbering: the stage changes only through promotion.
export function saveStrategy(
  strategyId: string,
  submitted: StrategyDraftDto,
  summary: string,
): SavedStrategyDto | string {
  const existing = findDraft(strategyId);
  if (existing === undefined) return `No strategy has the id "${strategyId}".`;
  if (String(submitted.strategyId) !== strategyId) {
    return 'The definition belongs to another strategy.';
  }
  if (nameTaken(submitted.name, strategyId)) {
    return `A strategy called "${submitted.name}" already exists.`;
  }

  const now = nowUtc();
  const draft: StrategyDraftDto = {
    ...submitted,
    strategyId: existing.strategyId,
    stage: existing.stage,
    version: nextVersion(existing.version),
    updatedAt: now,
  };
  const entry: SavedEntry = {
    draft,
    versions: [
      { version: draft.version, savedAt: now, summary, draft },
      ...listVersions(strategyId),
    ],
  };
  state().saved[strategyId] = entry;
  persist();
  return entry;
}
