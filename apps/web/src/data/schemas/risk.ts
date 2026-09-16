// Risk and safety panel (UI spec 7.14). Every limit with its threshold and what it is measured
// against, the breaches that followed, and the recorded changes to limits and emergency controls.

import { z } from 'zod';

import { IsoUtcTimestampSchema, MoneySchema } from './common';

export const RiskLimitGroupSchema = z.enum(['global', 'market', 'instrument_type', 'strategy']);
export type RiskLimitGroupDto = z.infer<typeof RiskLimitGroupSchema>;

export const RiskLimitUnitSchema = z.enum(['percent', 'money', 'count', 'minutes']);
export type RiskLimitUnitDto = z.infer<typeof RiskLimitUnitSchema>;

export const RiskLimitSchema = z.object({
  id: z.string().min(1),
  group: RiskLimitGroupSchema,
  // What the limit applies to within its group: "US", "ETF", a strategy name, or "Whole portfolio".
  scopeLabel: z.string().min(1),
  name: z.string().min(1),
  unit: RiskLimitUnitSchema,
  // Most limits are ceilings. A cash reserve is a floor: it is breached by going below it.
  direction: z.enum(['maximum', 'minimum']),
  threshold: z.number(),
  // Null when there is no data to measure against, which the screen must say rather than show zero.
  used: z.number().nullable(),
  currency: z.string().nullable(),
  // What "used" is, in words: "Gold, 41.60% of holdings".
  measuredBy: z.string().min(1),
  // What happens when the limit is reached.
  consequence: z.string().min(1),
  isBreached: z.boolean(),
  isEditable: z.boolean(),
  // Bounds on what the threshold may be changed to.
  minimum: z.number(),
  maximum: z.number(),
});
export type RiskLimitDto = z.infer<typeof RiskLimitSchema>;

export const CooldownSchema = z.object({
  instrumentSymbol: z.string().min(1),
  action: z.string().min(1),
  endsAt: IsoUtcTimestampSchema,
});
export type CooldownDto = z.infer<typeof CooldownSchema>;

export const RiskChangeKindSchema = z.enum([
  'limit_changed',
  'automation_stopped',
  'automation_resumed',
  'orders_cancelled',
]);
export type RiskChangeKindDto = z.infer<typeof RiskChangeKindSchema>;

export const RiskChangeSchema = z.object({
  id: z.string().min(1),
  at: IsoUtcTimestampSchema,
  kind: RiskChangeKindSchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  reason: z.string().min(1),
});
export type RiskChangeDto = z.infer<typeof RiskChangeSchema>;

export const RiskPanelSchema = z.object({
  asOf: IsoUtcTimestampSchema,
  // Invested plus cash: the base every percentage of capital is taken from.
  totalCapital: MoneySchema,
  limits: z.array(RiskLimitSchema),
  cooldowns: z.array(CooldownSchema),
  changes: z.array(RiskChangeSchema),
});
export type RiskPanelDto = z.infer<typeof RiskPanelSchema>;

export const BreachSeveritySchema = z.enum(['warning', 'critical']);

export const RiskBreachSchema = z.object({
  id: z.string().min(1),
  limitId: z.string().nullable(),
  title: z.string().min(1),
  severity: BreachSeveritySchema,
  cause: z.string().min(1),
  startedAt: IsoUtcTimestampSchema,
  endedAt: IsoUtcTimestampSchema.nullable(),
  halted: z.string().min(1),
  resolution: z.string().min(1),
});
export type RiskBreachDto = z.infer<typeof RiskBreachSchema>;

export const RiskBreachListSchema = z.array(RiskBreachSchema);

export const LimitChangeRequestSchema = z.object({
  threshold: z.number(),
  reason: z.string().trim().min(1, 'A reason is required to change a limit'),
});
export type LimitChangeRequestDto = z.infer<typeof LimitChangeRequestSchema>;

export const EmergencyActionSchema = z.enum([
  'stop_automation',
  'resume_automation',
  'cancel_working_orders',
]);
export type EmergencyActionDto = z.infer<typeof EmergencyActionSchema>;

export const EmergencyRequestSchema = z.object({
  action: EmergencyActionSchema,
  reason: z.string().trim().min(1, 'A reason is required for an emergency action'),
});
export type EmergencyRequestDto = z.infer<typeof EmergencyRequestSchema>;
