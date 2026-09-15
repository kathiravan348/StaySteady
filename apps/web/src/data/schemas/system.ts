import { z } from 'zod';
import { CurrencyCodeSchema, IsoUtcTimestampSchema } from './common';

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

export const AutomationModeSchema = z.enum([
  'live-autonomous',
  'live-supervised',
  'paper',
  'backtest',
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

export const AlertSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type AlertSeverityDto = z.infer<typeof AlertSeveritySchema>;

export const AlertCategorySchema = z.enum(['system', 'risk', 'market', 'execution', 'compliance']);
export type AlertCategoryDto = z.infer<typeof AlertCategorySchema>;

export const AlertSchema = z.object({
  id: z.string().min(1),
  severity: AlertSeveritySchema,
  category: AlertCategorySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  timestamp: IsoUtcTimestampSchema,
  acknowledged: z.boolean(),
});
export type AlertDto = z.infer<typeof AlertSchema>;

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  timestamp: IsoUtcTimestampSchema,
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type AuditLogDto = z.infer<typeof AuditLogSchema>;
