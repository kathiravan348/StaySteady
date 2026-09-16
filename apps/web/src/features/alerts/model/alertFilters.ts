// Filtering the Alerts Centre (UI spec 7.19): severity, category, market and state.

import type { BadgeVariant } from '@staysteady/ui';

import type { AlertGroupDto, AlertStateDto, SeverityDto } from '../../../data/schemas';
import type { AlertCategoryDto } from '../../../data/schemas';

export const ALL = 'all';
export const NO_MARKET = 'none';

export interface AlertFilters {
  readonly severity: SeverityDto | typeof ALL;
  readonly category: AlertCategoryDto | typeof ALL;
  readonly market: string;
  // "active" is open or acknowledged: everything not yet resolved.
  readonly state: AlertStateDto | 'active' | typeof ALL;
}

export const DEFAULT_ALERT_FILTERS: AlertFilters = {
  severity: ALL,
  category: ALL,
  market: ALL,
  state: 'active',
};

export function applyAlertFilters(
  alerts: readonly AlertGroupDto[],
  filters: AlertFilters,
): readonly AlertGroupDto[] {
  return alerts.filter(
    (alert) =>
      (filters.severity === ALL || alert.severity === filters.severity) &&
      (filters.category === ALL || alert.category === filters.category) &&
      (filters.market === ALL || (alert.marketId ?? NO_MARKET) === filters.market) &&
      (filters.state === ALL ||
        (filters.state === 'active' ? alert.state !== 'resolved' : alert.state === filters.state)),
  );
}

export const SEVERITY: Readonly<
  Record<SeverityDto, { label: string; variant: BadgeVariant; symbol: string }>
> = {
  critical: { label: 'Critical', variant: 'critical', symbol: '!!' },
  high: { label: 'High', variant: 'negative', symbol: '!' },
  medium: { label: 'Medium', variant: 'warning', symbol: '•' },
  low: { label: 'Low', variant: 'neutral', symbol: '·' },
};

export const STATE: Readonly<Record<AlertStateDto, { label: string; variant: BadgeVariant }>> = {
  open: { label: 'Open', variant: 'info' },
  acknowledged: { label: 'Acknowledged', variant: 'neutral' },
  resolved: { label: 'Resolved', variant: 'positive' },
};

export const CATEGORY_LABELS: Readonly<Record<AlertCategoryDto, string>> = {
  critical: 'Critical',
  action_needed: 'Needs action',
  informational: 'Information',
  scheduled: 'Scheduled',
};
