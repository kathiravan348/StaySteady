import { z } from 'zod';

import {
  AlertIdSchema,
  CurrencyCodeSchema,
  IncidentIdSchema,
  IsoUtcTimestampSchema,
  SeveritySchema,
} from './common';

export const ServiceStatusSchema = z.enum(['healthy', 'degraded', 'down']);
export type ServiceStatusDto = z.infer<typeof ServiceStatusSchema>;

export const ServiceHealthSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: ServiceStatusSchema,
  latencyMs: z.number().nonnegative(),
  lastHeartbeat: IsoUtcTimestampSchema,
});
export type ServiceHealthDto = z.infer<typeof ServiceHealthSchema>;

export const SystemHealthResponseSchema = z.object({
  overallStatus: ServiceStatusSchema,
  activeScenario: z.string(),
  services: z.array(ServiceHealthSchema),
  checkedAt: IsoUtcTimestampSchema,
});
export type SystemHealthResponseDto = z.infer<typeof SystemHealthResponseSchema>;

// Requirements 16 and UI spec 5 — operating modes. Values match the UI SystemMode type.
export const AutomationModeSchema = z.enum([
  'simulation',
  'observation',
  'manual-approval',
  'full-automation',
]);
export type AutomationModeDto = z.infer<typeof AutomationModeSchema>;

export const SystemStateResponseSchema = z.object({
  mode: AutomationModeSchema,
  killSwitchActive: z.boolean(),
  baseCurrency: CurrencyCodeSchema,
  activeScenario: z.string(),
  updatedAt: IsoUtcTimestampSchema,
});
export type SystemStateResponseDto = z.infer<typeof SystemStateResponseSchema>;

// Requirements 19 — alert categories. Severity uses the shared requirements 11 tiers.
export const AlertCategorySchema = z.enum([
  'critical',
  'action_needed',
  'informational',
  'scheduled',
]);
export type AlertCategoryDto = z.infer<typeof AlertCategorySchema>;

export const AlertSchema = z.object({
  id: AlertIdSchema,
  severity: SeveritySchema,
  category: AlertCategorySchema,
  // UI spec 7.19 — the component, market, broker or strategy that raised it
  source: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  timestamp: IsoUtcTimestampSchema,
  acknowledged: z.boolean(),
});
export type AlertDto = z.infer<typeof AlertSchema>;

// Requirements 11 and UI spec 7.15 — incident record for every failure.
export const IncidentSchema = z.object({
  id: IncidentIdSchema,
  severity: SeveritySchema,
  title: z.string().min(1),
  affectedComponents: z.array(z.string().min(1)).min(1),
  startedAt: IsoUtcTimestampSchema,
  resolvedAt: IsoUtcTimestampSchema.optional(),
  automaticActions: z.array(z.string().min(1)),
  resolution: z.string().optional(),
});
export type IncidentDto = z.infer<typeof IncidentSchema>;

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  timestamp: IsoUtcTimestampSchema,
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type AuditLogDto = z.infer<typeof AuditLogSchema>;
