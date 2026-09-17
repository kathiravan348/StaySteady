// Audit log (UI spec 7.20), built from the records other screens write and read: configuration
// versions, risk changes, order lifecycles and strategy versions and stages. Nothing is seeded here,
// so a change made anywhere in the app shows up in the log.

import type { z } from 'zod';

import type {
  AuditEntrySchema,
  OrderEventDto,
  OrderHistoryItemDto,
  RiskChangeDto,
  StrategyStageDto,
  StrategyVersionDto,
} from '../../schemas';
import { humanizeToken } from '../../../shared/format';

type Entry = z.input<typeof AuditEntrySchema>;
type Change = Entry['changes'][number];

export interface VersionRecord {
  readonly version: number;
  readonly savedAt: string;
  readonly reason: string;
  readonly snapshot: unknown;
}

export interface ConfigArea {
  // e.g. "Market", "Data provider".
  readonly noun: string;
  readonly entries: ReadonlyMap<string, readonly VersionRecord[]>;
}

export interface StrategyRecord {
  readonly id: string;
  readonly name: string;
  readonly stage: StrategyStageDto;
  readonly versions: readonly StrategyVersionDto[];
}

export interface AuditSources {
  readonly configAreas: readonly ConfigArea[];
  readonly riskChanges: readonly RiskChangeDto[];
  readonly orders: readonly OrderHistoryItemDto[];
  readonly strategies: readonly StrategyRecord[];
  readonly nowMs: number;
}

const MAX_CHANGES = 25;

// Flattens a snapshot to dotted paths with display values, so two versions compare field by field.
function flatten(value: unknown, path: string, out: Map<string, string>): void {
  if (value === null || value === undefined) {
    out.set(path, 'None');
  } else if (Array.isArray(value)) {
    if (value.every((item) => typeof item !== 'object' || item === null)) {
      out.set(path, value.length === 0 ? 'None' : value.map(String).join(', '));
    } else {
      value.forEach((item, index) => {
        flatten(item, `${path}[${String(index + 1)}]`, out);
      });
    }
  } else if (typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      flatten(item, path === '' ? key : `${path}.${key}`, out);
    });
  } else {
    out.set(path, String(value));
  }
}

// "fees.commissionBps" -> "Fees › commission bps"; "regularHours[1].end" -> "Regular hours 1 › end".
function fieldLabel(path: string): string {
  const words = path
    .split('.')
    .map((segment) =>
      segment
        .replace(/\[(\d+)\]/g, ' $1')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase(),
    )
    .join(' › ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function diffSnapshots(before: unknown, after: unknown): Change[] {
  const a = new Map<string, string>();
  const b = new Map<string, string>();
  flatten(before, '', a);
  flatten(after, '', b);
  const keys = [...new Set([...a.keys(), ...b.keys()])];
  return keys
    .filter((key) => a.get(key) !== b.get(key))
    .map((key) => ({
      field: fieldLabel(key),
      before: a.get(key) ?? null,
      after: b.get(key) ?? null,
    }))
    .slice(0, MAX_CHANGES);
}

function configEntries(area: ConfigArea): Entry[] {
  return [...area.entries.entries()].flatMap(([id, versions]) =>
    versions.map((version, index) => {
      const previous = versions[index + 1];
      return {
        id: `config-${area.noun}-${id}-v${String(version.version)}`,
        at: version.savedAt,
        category: 'configuration' as const,
        trigger: 'owner' as const,
        title:
          previous === undefined
            ? `${area.noun} ${id} configured`
            : `${area.noun} ${id} changed (version ${String(version.version)})`,
        subject: `${area.noun} ${id}`,
        changes: previous === undefined ? [] : diffSnapshots(previous.snapshot, version.snapshot),
        reason: version.reason,
        orderId: null,
      };
    }),
  );
}

const ORDER_EVENT: Readonly<
  Record<OrderEventDto['kind'], { category: Entry['category']; trigger: Entry['trigger'] }>
> = {
  signal_raised: { category: 'signal', trigger: 'strategy' },
  approval_requested: { category: 'approval', trigger: 'system' },
  approved: { category: 'approval', trigger: 'owner' },
  rejected: { category: 'approval', trigger: 'owner' },
  submitted: { category: 'order', trigger: 'system' },
  acknowledged: { category: 'order', trigger: 'broker' },
  partially_filled: { category: 'order', trigger: 'broker' },
  filled: { category: 'order', trigger: 'broker' },
  cancelled: { category: 'order', trigger: 'system' },
  confirmation_lost: { category: 'order', trigger: 'system' },
};

function orderEntries(order: OrderHistoryItemDto): Entry[] {
  return order.timeline.map((event, index) => {
    const previous = order.timeline[index - 1];
    const map = ORDER_EVENT[event.kind];
    // A manual order is submitted by the owner; a strategy's by the system.
    const trigger = event.kind === 'submitted' && order.strategyId === null ? 'owner' : map.trigger;
    return {
      id: `order-${order.orderId}-${String(index)}`,
      at: event.at,
      category: map.category,
      trigger,
      title: event.title,
      subject: `Order ${order.orderId} (${order.side} ${String(order.quantity)} ${order.instrumentSymbol})`,
      changes:
        map.category === 'order' || event.kind === 'approved' || event.kind === 'rejected'
          ? [
              {
                field: 'Stage',
                before: previous === undefined ? null : humanizeToken(previous.kind),
                after: humanizeToken(event.kind),
              },
            ]
          : [],
      reason: event.detail,
      orderId: order.orderId,
    };
  });
}

function riskEntries(change: RiskChangeDto): Entry {
  return {
    id: `risk-${change.id}`,
    at: change.at,
    category: change.kind === 'limit_changed' ? 'risk_limit' : 'emergency',
    trigger: 'owner',
    title: change.title,
    subject: change.kind === 'limit_changed' ? 'Risk limit' : 'Emergency control',
    changes: [{ field: 'Change', before: null, after: change.detail }],
    reason: change.reason,
    orderId: null,
  };
}

const STAGES: readonly StrategyStageDto[] = [
  'draft',
  'backtested',
  'observation',
  'semi_automatic',
  'fully_automatic',
];
const DAY_MS = 86_400_000;
const STAGE_GAP_DAYS = 45;

function strategyEntries(strategy: StrategyRecord, nowMs: number): Entry[] {
  const reached = STAGES.indexOf(strategy.stage);
  // Promotions live in the browser session on the library screen, not on the server, so each step up
  // to the current stage is recorded at a date derived from it (see the session 45 log).
  const promotions = STAGES.slice(1, reached + 1).map((stage, index) => ({
    id: `stage-${strategy.id}-${stage}`,
    at: new Date(nowMs - (reached - index) * STAGE_GAP_DAYS * DAY_MS).toISOString(),
    category: 'strategy_stage' as const,
    trigger: 'owner' as const,
    title: `${strategy.name} promoted to ${humanizeToken(stage)}`,
    subject: `Strategy ${strategy.name}`,
    changes: [
      {
        field: 'Stage',
        before: humanizeToken(STAGES[index] ?? 'draft'),
        after: humanizeToken(stage),
      },
    ],
    reason:
      'Promotion date derived from the current stage; promotions are not yet recorded on the server.',
    orderId: null,
  }));
  const definitions = strategy.versions.flatMap((version, index) => {
    const older = strategy.versions[index + 1];
    if (older === undefined) return [];
    return [
      {
        id: `strategy-${strategy.id}-${version.version}`,
        at: version.savedAt,
        category: 'strategy_definition' as const,
        trigger: 'owner' as const,
        title: `${strategy.name} definition changed`,
        subject: `Strategy ${strategy.name}`,
        changes: [
          { field: 'Version', before: older.version, after: version.version },
          ...diffSnapshots(older.draft, version.draft).filter(
            (change) => change.field !== 'Version',
          ),
        ],
        reason: version.summary,
        orderId: null,
      },
    ];
  });
  return [...promotions, ...definitions];
}

export function buildAuditLog(sources: AuditSources): Entry[] {
  return [
    ...sources.configAreas.flatMap(configEntries),
    ...sources.riskChanges.map(riskEntries),
    ...sources.orders.flatMap(orderEntries),
    ...sources.strategies.flatMap((strategy) => strategyEntries(strategy, sources.nowMs)),
  ].sort((a, b) => b.at.localeCompare(a.at));
}
