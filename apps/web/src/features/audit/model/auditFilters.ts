// Filtering and searching the audit log (UI spec 7.20).

import type { AuditCategoryDto, AuditEntryDto, AuditTriggerDto } from '../../../data/schemas';

export const ALL = 'all';

export interface AuditFilters {
  readonly category: AuditCategoryDto | typeof ALL;
  readonly trigger: AuditTriggerDto | typeof ALL;
  readonly from: string;
  readonly to: string;
  readonly search: string;
}

export const DEFAULT_AUDIT_FILTERS: AuditFilters = {
  category: ALL,
  trigger: ALL,
  from: '',
  to: '',
  search: '',
};

export const CATEGORY_LABELS: Readonly<Record<AuditCategoryDto, string>> = {
  configuration: 'Configuration',
  approval: 'Approval',
  order: 'Order',
  signal: 'Signal',
  risk_limit: 'Risk limit',
  emergency: 'Emergency control',
  strategy_stage: 'Stage promotion',
  strategy_definition: 'Strategy definition',
};

export const TRIGGER_LABELS: Readonly<Record<AuditTriggerDto, string>> = {
  owner: 'You',
  strategy: 'A strategy',
  system: 'The system',
  broker: 'The broker',
};

// Search looks at everything written on the entry: title, subject, reason and every change.
function haystack(entry: AuditEntryDto): string {
  return [
    entry.title,
    entry.subject,
    entry.reason ?? '',
    ...entry.changes.flatMap((change) => [change.field, change.before ?? '', change.after ?? '']),
  ]
    .join(' ')
    .toLowerCase();
}

export function applyAuditFilters(
  entries: readonly AuditEntryDto[],
  filters: AuditFilters,
): readonly AuditEntryDto[] {
  const terms = filters.search
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term !== '');
  return entries.filter((entry) => {
    const day = String(entry.at).slice(0, 10);
    const text = terms.length === 0 ? '' : haystack(entry);
    return (
      (filters.category === ALL || entry.category === filters.category) &&
      (filters.trigger === ALL || entry.trigger === filters.trigger) &&
      (filters.from === '' || day >= filters.from) &&
      (filters.to === '' || day <= filters.to) &&
      terms.every((term) => text.includes(term))
    );
  });
}
