// System Health view model (UI spec 7.15). Pure: status meta, freshness, durations, incident filters.

import type { BadgeVariant } from '@staysteady/ui';

import type {
  ComponentHealthDto,
  ComponentKindDto,
  DataFreshnessDto,
  IncidentDto,
  ServiceStatusDto,
  SeverityDto,
} from '../../../data/schemas';
import type { MarketSessionState } from '../../../shared/marketTime';

// Colour is never the only signal: every status has a distinct symbol and word (UI spec 4).
export const STATUS_META: Readonly<
  Record<ServiceStatusDto, { label: string; icon: string; variant: BadgeVariant; rank: number }>
> = {
  down: { label: 'Down', icon: '✕', variant: 'critical', rank: 0 },
  degraded: { label: 'Degraded', icon: '▲', variant: 'warning', rank: 1 },
  healthy: { label: 'Healthy', icon: '●', variant: 'positive', rank: 2 },
};

export const SEVERITY_META: Readonly<
  Record<SeverityDto, { label: string; variant: BadgeVariant }>
> = {
  critical: { label: 'Critical', variant: 'critical' },
  high: { label: 'High', variant: 'negative' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'neutral' },
};

export const KIND_LABELS: Readonly<Record<ComponentKindDto, string>> = {
  collector: 'Data collector',
  provider: 'Data provider',
  broker: 'Broker',
  cache: 'Cache',
  database: 'Database',
  'strategy-engine': 'Strategy engine',
  execution: 'Execution',
  scheduler: 'Scheduled jobs',
  notification: 'Notifications',
  watchdog: 'Watchdog',
};

// Most urgent first, so a broken component is never below the fold.
export function sortByUrgency(components: readonly ComponentHealthDto[]): ComponentHealthDto[] {
  return [...components].sort(
    (a, b) =>
      STATUS_META[a.status].rank - STATUS_META[b.status].rank || a.name.localeCompare(b.name),
  );
}

export interface ComponentSummary {
  readonly healthy: number;
  readonly degraded: number;
  readonly down: number;
  readonly overall: ServiceStatusDto;
}

export function summariseComponents(components: readonly ComponentHealthDto[]): ComponentSummary {
  const count = (status: ServiceStatusDto): number =>
    components.filter((component) => component.status === status).length;
  const down = count('down');
  const degraded = count('degraded');
  return {
    healthy: count('healthy'),
    degraded,
    down,
    overall: down > 0 ? 'down' : degraded > 0 ? 'degraded' : 'healthy',
  };
}

export type FreshnessState = 'fresh' | 'late' | 'stale' | 'closed';

export const FRESHNESS_META: Readonly<
  Record<FreshnessState, { label: string; icon: string; variant: BadgeVariant }>
> = {
  fresh: { label: 'Fresh', icon: '●', variant: 'positive' },
  late: { label: 'Late', icon: '▲', variant: 'warning' },
  stale: { label: 'Stale', icon: '✕', variant: 'critical' },
  closed: { label: 'Market closed', icon: '■', variant: 'neutral' },
};

// Late past the expected age; stale past three times it. A closed market is expected to be quiet.
export function evaluateFreshness(
  item: DataFreshnessDto,
  nowMs: number,
  marketState: MarketSessionState | null,
): { readonly state: FreshnessState; readonly ageSeconds: number } {
  const ageSeconds = Math.max(0, Math.round((nowMs - Date.parse(item.newestDataAt)) / 1000));
  if (item.scope === 'market' && (marketState === 'closed' || marketState === 'holiday')) {
    return { state: 'closed', ageSeconds };
  }
  if (ageSeconds > item.expectedMaxAgeSeconds * 3) return { state: 'stale', ageSeconds };
  return { state: ageSeconds > item.expectedMaxAgeSeconds ? 'late' : 'fresh', ageSeconds };
}

export function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes === 0
      ? `${seconds} s`
      : seconds === 0
        ? `${minutes} min`
        : `${minutes} min ${seconds} s`;
  }
  return formatAge(totalSeconds);
}

export interface IncidentFilters {
  readonly search: string;
  readonly severity: 'all' | SeverityDto;
  readonly status: 'all' | 'ongoing' | 'resolved';
  readonly component: string;
}

export const EMPTY_INCIDENT_FILTERS: IncidentFilters = {
  search: '',
  severity: 'all',
  status: 'all',
  component: 'all',
};

export function filterIncidents(
  incidents: readonly IncidentDto[],
  filters: IncidentFilters,
  componentNames: ReadonlyMap<string, string>,
): IncidentDto[] {
  const needle = filters.search.trim().toLowerCase();
  return incidents.filter((incident) => {
    if (filters.severity !== 'all' && incident.severity !== filters.severity) return false;
    const ongoing = incident.resolvedAt === undefined;
    if (filters.status === 'ongoing' && !ongoing) return false;
    if (filters.status === 'resolved' && ongoing) return false;
    if (filters.component !== 'all' && !incident.affectedComponents.includes(filters.component)) {
      return false;
    }
    if (needle === '') return true;
    const haystack = [
      incident.title,
      incident.resolution ?? '',
      ...incident.automaticActions,
      ...incident.affectedComponents.map((id) => componentNames.get(id) ?? id),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}
