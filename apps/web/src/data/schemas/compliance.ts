import { z } from 'zod';

import { IsoUtcTimestampSchema } from './common';

export const RestrictedReasonCategorySchema = z.enum([
  'EMPLOYER_EQUITY',
  'AUDIT_CLIENT',
  'MNPI_EXPOSURE',
  'CONFLICT_OF_INTEREST',
  'REGULATORY_SANCTION',
  'SHORT_SWING_RULE',
]);
export type RestrictedReasonCategory = z.infer<typeof RestrictedReasonCategorySchema>;

export const RestrictedInstrumentSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetClass: z.enum(['EQUITY', 'DERIVATIVE', 'FIXED_INCOME', 'ALL']),
  jurisdiction: z.enum(['US', 'IN', 'GLOBAL']),
  reasonCategory: RestrictedReasonCategorySchema,
  policyClause: z.string().min(1),
  effectiveFrom: IsoUtcTimestampSchema,
  reviewDueDate: IsoUtcTimestampSchema,
  isReviewOverdue: z.boolean(),
  notes: z.string(),
  addedBy: z.string(),
});
export type RestrictedInstrument = z.infer<typeof RestrictedInstrumentSchema>;

export const BlackoutWindowTypeSchema = z.enum([
  'QUARTERLY_EARNINGS',
  'MA_TRANSACTION',
  'REGULATORY_QUIET_PERIOD',
  'AD_HOC',
]);
export type BlackoutWindowType = z.infer<typeof BlackoutWindowTypeSchema>;

export const BlackoutWindowStatusSchema = z.enum(['ACTIVE', 'UPCOMING', 'EXPIRED']);
export type BlackoutWindowStatus = z.infer<typeof BlackoutWindowStatusSchema>;

export const BlackoutWindowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  scope: z.string().min(1),
  // What the window covers, used by the eligibility check: listed symbols, or every equity.
  symbols: z.array(z.string().min(1)),
  appliesToAll: z.boolean(),
  windowType: BlackoutWindowTypeSchema,
  startDate: IsoUtcTimestampSchema,
  endDate: IsoUtcTimestampSchema,
  status: BlackoutWindowStatusSchema,
  daysRemaining: z.number().int(),
  preClearanceRequired: z.boolean(),
  policyReference: z.string().min(1),
  notes: z.string(),
});
export type BlackoutWindow = z.infer<typeof BlackoutWindowSchema>;

export const HoldingPeriodLockSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  instrumentName: z.string().min(1),
  lotId: z.string().min(1),
  acquisitionDate: IsoUtcTimestampSchema,
  quantity: z.number().positive(),
  minimumHoldingDays: z.number().int().positive(),
  unlockDate: IsoUtcTimestampSchema,
  daysRemaining: z.number().int(),
  ruleReference: z.string().min(1),
});
export type HoldingPeriodLock = z.infer<typeof HoldingPeriodLockSchema>;

export const RefusalStageSchema = z.literal('SIGNAL_STAGE');

export const RefusalRecordSchema = z.object({
  id: z.string().min(1),
  timestamp: IsoUtcTimestampSchema,
  symbol: z.string().min(1),
  instrumentName: z.string().min(1),
  action: z.enum(['BUY', 'SELL']),
  source: z.enum(['AUTOMATED_SIGNAL', 'MANUAL_TRADE', 'LIMIT_OVERRIDE']),
  strategyName: z.string().nullable(),
  ruleViolated: z.string().min(1),
  policyClause: z.string().min(1),
  refusalReason: z.string().min(1),
  stage: RefusalStageSchema,
});
export type RefusalRecord = z.infer<typeof RefusalRecordSchema>;

export const DisclosureStatusSchema = z.enum(['PENDING', 'SUBMITTED', 'OVERDUE']);
export type DisclosureStatus = z.infer<typeof DisclosureStatusSchema>;

export const DisclosureObligationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  frequency: z.enum(['QUARTERLY', 'ANNUAL', 'EVENT_DRIVEN']),
  nextDeadline: IsoUtcTimestampSchema,
  daysUntilDeadline: z.number().int(),
  status: DisclosureStatusSchema,
  jurisdiction: z.string().min(1),
  recipient: z.string().min(1),
});
export type DisclosureObligation = z.infer<typeof DisclosureObligationSchema>;

// Employer trading policy as configuration (E-09; requirements 27; decision 43). Off means blackout
// windows, holding locks and employer-equity restrictions are not enforced; restrictions for other
// reasons (conflicts, sanctions, insider lists) always are.
export const EmployerPolicySchema = z.object({
  enabled: z.boolean(),
  employerName: z.string().trim(),
  preClearanceRequired: z.boolean(),
  // 0 turns minimum holding locks off.
  minimumHoldingDays: z.number().int().min(0, 'Cannot be negative').max(365, 'At most a year'),
});
export type EmployerPolicy = z.infer<typeof EmployerPolicySchema>;

export const CompliancePolicyOverviewSchema = z.object({
  policyVersion: z.string().min(1),
  lastReviewedDate: IsoUtcTimestampSchema,
  nextReviewDueDate: IsoUtcTimestampSchema,
  daysUntilReviewDue: z.number().int(),
  isReviewOverdue: z.boolean(),
  activeBlackoutCount: z.number().int().nonnegative(),
  restrictedInstrumentsCount: z.number().int().nonnegative(),
  activeLocksCount: z.number().int().nonnegative(),
  preClearanceEnforced: z.boolean(),
  employerPolicy: EmployerPolicySchema,
});
export type CompliancePolicyOverview = z.infer<typeof CompliancePolicyOverviewSchema>;

export const ComplianceViewSchema = z.object({
  overview: CompliancePolicyOverviewSchema,
  restrictedInstruments: z.array(RestrictedInstrumentSchema),
  blackoutWindows: z.array(BlackoutWindowSchema),
  holdingLocks: z.array(HoldingPeriodLockSchema),
  refusals: z.array(RefusalRecordSchema),
  disclosures: z.array(DisclosureObligationSchema),
});
export type ComplianceView = z.infer<typeof ComplianceViewSchema>;

// Inputs & Checks
export const AddRestrictedInstrumentInputSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  name: z.string().min(1, 'Instrument name is required'),
  assetClass: z.enum(['EQUITY', 'DERIVATIVE', 'FIXED_INCOME', 'ALL']),
  jurisdiction: z.enum(['US', 'IN', 'GLOBAL']),
  reasonCategory: RestrictedReasonCategorySchema,
  policyClause: z.string().min(1, 'Policy clause reference is required'),
  notes: z.string().default(''),
});
export type AddRestrictedInstrumentInput = z.infer<typeof AddRestrictedInstrumentInputSchema>;

export const EligibilityCheckStatusSchema = z.enum(['ALLOWED', 'REFUSED']);
export type EligibilityCheckStatus = z.infer<typeof EligibilityCheckStatusSchema>;

// Which rule refused the trade; null when it is allowed.
export const EligibilityRuleSchema = z.enum(['restricted_list', 'blackout', 'holding_lock']);
export type EligibilityRule = z.infer<typeof EligibilityRuleSchema>;

export const EligibilityCheckResultSchema = z.object({
  symbol: z.string(),
  action: z.enum(['BUY', 'SELL']),
  status: EligibilityCheckStatusSchema,
  rule: EligibilityRuleSchema.nullable(),
  primaryReason: z.string(),
  policyClause: z.string(),
  details: z.string(),
  restrictionsTriggered: z.array(z.string()),
  preClearanceRequired: z.boolean(),
});
export type EligibilityCheckResult = z.infer<typeof EligibilityCheckResultSchema>;
