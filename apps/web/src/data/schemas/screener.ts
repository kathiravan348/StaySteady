// Domain schemas for S-26 Markets Screener (UI spec 8.3; Open Question 11).
// Defines multi-factor filter criteria, preset strategies, row models, and search responses.

import { z } from 'zod';

export const ScreenerComplianceFilterSchema = z.enum(['ALL', 'ALLOWED_ONLY', 'RESTRICTED_ONLY']);
export type ScreenerComplianceFilter = z.infer<typeof ScreenerComplianceFilterSchema>;

export const ScreenerFilterCriteriaSchema = z.object({
  query: z.string().default(''),
  markets: z.array(z.string()).default([]),
  assetClasses: z.array(z.enum(['EQUITY', 'ETF'])).default([]),
  sectors: z.array(z.string()).default([]),
  minPe: z.number().nullable().default(null),
  maxPe: z.number().nullable().default(null),
  minPb: z.number().nullable().default(null),
  maxPb: z.number().nullable().default(null),
  minRoe: z.number().nullable().default(null),
  minDivYield: z.number().nullable().default(null),
  minMarketCap: z.number().nullable().default(null),
  minRsi14: z.number().nullable().default(null),
  maxRsi14: z.number().nullable().default(null),
  minSma200Dist: z.number().nullable().default(null),
  complianceOnly: z.boolean().default(false),
  automationOnly: z.boolean().default(false),
  sortBy: z.string().default('marketCap'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10),
});
export type ScreenerFilterCriteria = z.infer<typeof ScreenerFilterCriteriaSchema>;

export const ScreenerPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string(),
  filters: ScreenerFilterCriteriaSchema,
});
export type ScreenerPreset = z.infer<typeof ScreenerPresetSchema>;

export const ScreenerRowComplianceStatusSchema = z.enum([
  'ALLOWED',
  'RESTRICTED',
  'BLACKOUT',
  'LOCKED',
]);
export type ScreenerRowComplianceStatus = z.infer<typeof ScreenerRowComplianceStatusSchema>;

export const ScreenerRowSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  marketId: z.string().min(1),
  marketName: z.string().min(1),
  assetClass: z.enum(['EQUITY', 'ETF']),
  sector: z.string().min(1),
  currency: z.string().min(1),
  price: z.string(),
  change24hPct: z.number(),
  marketCapNumber: z.number(),
  marketCapFormatted: z.string(),
  peRatio: z.number().nullable(),
  pbRatio: z.number().nullable(),
  roePct: z.number().nullable(),
  dividendYieldPct: z.number().nullable(),
  rsi14: z.number(),
  sma200DistancePct: z.number(),
  averageDailyVolume: z.string(),
  complianceStatus: ScreenerRowComplianceStatusSchema,
  complianceReason: z.string().nullable(),
  automationPermission: z.enum(['LIVE', 'SIMULATION', 'BLOCKED']),
});
export type ScreenerRow = z.infer<typeof ScreenerRowSchema>;

export const ScreenerSummaryMetricsSchema = z.object({
  universeCount: z.number().int().nonnegative(),
  matchedCount: z.number().int().nonnegative(),
  medianPe: z.number().nullable(),
  medianRoePct: z.number().nullable(),
  medianDivYieldPct: z.number().nullable(),
});
export type ScreenerSummaryMetrics = z.infer<typeof ScreenerSummaryMetricsSchema>;

export const ScreenerSearchResultSchema = z.object({
  rows: z.array(ScreenerRowSchema),
  summary: ScreenerSummaryMetricsSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type ScreenerSearchResult = z.infer<typeof ScreenerSearchResultSchema>;
