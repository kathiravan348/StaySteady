// Labels, badges, and formatters for continuity and emergency access (requirements 28).

import type { BadgeVariant } from '@staysteady/ui';

import type { InstitutionTypeDto, NomineeStatusDto } from '../../../data/schemas/continuity';

export const INSTITUTION_TYPE_LABELS: Readonly<Record<InstitutionTypeDto, string>> = {
  broker: 'Brokerage',
  bank: 'Bank Account',
  depository: 'Depository',
  custodian: 'Custodian',
  other: 'Other Institution',
};

export const NOMINEE_STATUS_CONFIG: Readonly<
  Record<NomineeStatusDto, { label: string; variant: BadgeVariant }>
> = {
  registered: { label: 'Nominee Registered', variant: 'positive' },
  pending_confirmation: { label: 'Confirmation Pending', variant: 'warning' },
  unregistered: { label: 'No Nominee Registered', variant: 'critical' },
};

export const DRILL_OUTCOME_CONFIG: Readonly<
  Record<'passed' | 'partial' | 'failed', { label: string; variant: BadgeVariant }>
> = {
  passed: { label: 'Drill Passed', variant: 'positive' },
  partial: { label: 'Partial Success', variant: 'warning' },
  failed: { label: 'Drill Failed', variant: 'critical' },
};
