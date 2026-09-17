// Continuity, succession, nominee, and emergency access schemas (requirements 28; UI spec 19.1).
// Ensures single-owner portfolio continuity, separation of read-only access from execution,
// and safe unattended dormancy.

import { z } from 'zod';

import { IsoUtcTimestampSchema } from './common';

export const InstitutionTypeSchema = z.enum(['broker', 'bank', 'depository', 'custodian', 'other']);
export type InstitutionTypeDto = z.infer<typeof InstitutionTypeSchema>;

export const NomineeStatusSchema = z.enum(['registered', 'pending_confirmation', 'unregistered']);
export type NomineeStatusDto = z.infer<typeof NomineeStatusSchema>;

export const InstitutionAccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  accountReference: z.string().min(1),
  type: InstitutionTypeSchema,
  jurisdiction: z.string().min(1),
  nomineeStatus: NomineeStatusSchema,
  nomineeNames: z.array(z.string().min(1)),
  lastConfirmedDate: IsoUtcTimestampSchema,
  reviewPeriodDays: z.number().int().positive(),
  isOverdue: z.boolean(),
  daysSinceConfirmation: z.number().int().nonnegative(),
});
export type InstitutionAccountDto = z.infer<typeof InstitutionAccountSchema>;

export const RecoveryLocationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  storageDescription: z.string().min(1),
  custodyMethod: z.string().min(1),
  lastAuditedDate: IsoUtcTimestampSchema,
  auditPeriodDays: z.number().int().positive(),
  isOverdue: z.boolean(),
  daysSinceAudit: z.number().int().nonnegative(),
});
export type RecoveryLocationDto = z.infer<typeof RecoveryLocationSchema>;

export const EmergencyDrillRecordSchema = z.object({
  id: z.string().min(1),
  drillDate: IsoUtcTimestampSchema,
  testedBy: z.string().min(1),
  routeTested: z.string().min(1),
  outcome: z.enum(['passed', 'partial', 'failed']),
  notes: z.string().min(1),
});
export type EmergencyDrillRecordDto = z.infer<typeof EmergencyDrillRecordSchema>;

export const EmergencyAccessPlaybookSchema = z.object({
  nominatedPerson: z.string().min(1),
  accessScope: z.string().min(1),
  stepByStepInstructions: z.array(z.string().min(1)),
  lastTestDate: IsoUtcTimestampSchema,
  testIntervalDays: z.number().int().positive(),
  isOverdue: z.boolean(),
  daysSinceLastTest: z.number().int().nonnegative(),
  drillHistory: z.array(EmergencyDrillRecordSchema),
});
export type EmergencyAccessPlaybookDto = z.infer<typeof EmergencyAccessPlaybookSchema>;

export const InactivitySettingSchema = z.object({
  thresholdDays: z.number().int().positive(),
  inactiveDays: z.number().int().nonnegative(),
  daysUntilPause: z.number().int().nonnegative(),
  isPaused: z.boolean(),
  lastHeartbeatAt: IsoUtcTimestampSchema,
  escalatingAlertDays: z.array(z.number().int().positive()),
});
export type InactivitySettingDto = z.infer<typeof InactivitySettingSchema>;

export const ContinuityViewSchema = z.object({
  asOf: IsoUtcTimestampSchema,
  overdueReviewsCount: z.number().int().nonnegative(),
  inactivity: InactivitySettingSchema,
  emergencyAccess: EmergencyAccessPlaybookSchema,
  institutions: z.array(InstitutionAccountSchema),
  recoveryLocations: z.array(RecoveryLocationSchema),
});
export type ContinuityViewDto = z.infer<typeof ContinuityViewSchema>;

export const RecordDrillRequestSchema = z.object({
  testedBy: z.string().trim().min(1, 'Name who performed the drill'),
  routeTested: z.string().trim().min(1, 'Describe what access route was tested'),
  outcome: z.enum(['passed', 'partial', 'failed']),
  notes: z.string().trim().min(1, 'Add drill notes and verification outcome'),
});
export type RecordDrillRequestDto = z.infer<typeof RecordDrillRequestSchema>;

export const UpdateInactivityRequestSchema = z.object({
  thresholdDays: z.number().int().min(7, 'Threshold must be at least 7 days').max(180),
});
export type UpdateInactivityRequestDto = z.infer<typeof UpdateInactivityRequestSchema>;
