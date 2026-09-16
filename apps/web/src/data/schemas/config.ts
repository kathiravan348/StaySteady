// Shared shapes for every configuration area (UI spec 7.18): health, simulation versus live, and
// the reason every saved change carries.

import { z } from 'zod';

export const ConfigHealthStatusSchema = z.enum(['healthy', 'warning', 'critical']);
export type ConfigHealthStatusDto = z.infer<typeof ConfigHealthStatusSchema>;

export const ConfigHealthSchema = z.object({
  status: ConfigHealthStatusSchema,
  summary: z.string().min(1),
});
export type ConfigHealthDto = z.infer<typeof ConfigHealthSchema>;

// New entries always start in simulation; nothing reaches a real venue until switched to live.
export const ConfigModeSchema = z.enum(['simulation', 'live']);
export type ConfigModeDto = z.infer<typeof ConfigModeSchema>;

export const ChangeReasonSchema = z
  .string()
  .trim()
  .min(1, 'Say why this is changing; the reason is kept with the version');

export const RevertRequestSchema = z.object({
  version: z.number().int().positive(),
  reason: ChangeReasonSchema,
});
export type RevertRequestDto = z.infer<typeof RevertRequestSchema>;
