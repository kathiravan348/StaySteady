// Display helpers and labels for S-33 Compliance (requirements 27; UI spec 19.1).

import type {
  BlackoutWindowStatus,
  BlackoutWindowType,
  DisclosureStatus,
  EligibilityCheckStatus,
  RestrictedReasonCategory,
} from '../../../data/schemas/compliance';
import type { BadgeVariant } from '@staysteady/ui';

export const REASON_CATEGORY_LABELS: Record<RestrictedReasonCategory, string> = {
  EMPLOYER_EQUITY: 'Employer Equity',
  AUDIT_CLIENT: 'Audit Client / Conflict',
  MNPI_EXPOSURE: 'MNPI / Insider List',
  CONFLICT_OF_INTEREST: 'Conflict of Interest',
  REGULATORY_SANCTION: 'Regulatory Sanction',
  SHORT_SWING_RULE: 'Short-Swing / Speculation',
};

export function getReasonBadgeVariant(category: RestrictedReasonCategory): BadgeVariant {
  switch (category) {
    case 'MNPI_EXPOSURE':
    case 'EMPLOYER_EQUITY':
      return 'critical';
    case 'AUDIT_CLIENT':
    case 'CONFLICT_OF_INTEREST':
      return 'warning';
    case 'REGULATORY_SANCTION':
    case 'SHORT_SWING_RULE':
      return 'info';
    default:
      return 'neutral';
  }
}

export const BLACKOUT_TYPE_LABELS: Record<BlackoutWindowType, string> = {
  QUARTERLY_EARNINGS: 'Quarterly Earnings Quiet Window',
  MA_TRANSACTION: 'M&A Advisory Mandate',
  REGULATORY_QUIET_PERIOD: 'Regulatory Quiet Period',
  AD_HOC: 'Ad-hoc Committee Blackout',
};

export function getBlackoutStatusBadge(status: BlackoutWindowStatus): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'ACTIVE':
      return { label: 'ACTIVE BLACKOUT', variant: 'critical' };
    case 'UPCOMING':
      return { label: 'UPCOMING', variant: 'info' };
    case 'EXPIRED':
      return { label: 'EXPIRED', variant: 'neutral' };
  }
}

export function getEligibilityBadge(status: EligibilityCheckStatus): {
  label: string;
  variant: BadgeVariant;
} {
  if (status === 'ALLOWED') {
    return { label: 'TRADING PERMITTED', variant: 'positive' };
  }
  return { label: 'TRADING REFUSED', variant: 'critical' };
}

export function getDisclosureStatusBadge(status: DisclosureStatus): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending Filing', variant: 'warning' };
    case 'SUBMITTED':
      return { label: 'Filed & Confirmed', variant: 'positive' };
    case 'OVERDUE':
      return { label: 'Overdue Deadline', variant: 'critical' };
  }
}
