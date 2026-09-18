// How the Ratios tab groups and reads the derived measures (R-09). Pure: every figure comes from
// the measures endpoint (decision 53); this only arranges it, it never computes a ratio.

import type { MeasureValueDto } from '../../../../data/schemas';

export const MEASURE_GROUPS = ['valuation', 'profitability', 'health', 'growth', 'cash'] as const;
export type MeasureGroupId = (typeof MEASURE_GROUPS)[number];

export const GROUP_TITLE: Readonly<Record<MeasureGroupId, string>> = {
  valuation: 'Valuation',
  profitability: 'Profitability',
  health: 'Financial health',
  growth: 'Growth',
  cash: 'Cash quality',
};

export const GROUP_DESCRIPTION: Readonly<Record<MeasureGroupId, string>> = {
  valuation: 'What the market price asks for the reported earnings, assets and sales.',
  profitability: 'How much of each unit of revenue or capital turns into profit.',
  health: 'How much the company owes against what it has and what it earns.',
  growth: 'How fast revenue and earnings per share have grown over the reported years.',
  cash: 'How much of the reported profit arrives as cash.',
};

export function measuresInGroup(
  measures: readonly MeasureValueDto[],
  group: MeasureGroupId,
): MeasureValueDto[] {
  return measures.filter((measure) => measure.group === group);
}

// The measure over time, oldest first, ending with the latest value. Years with no value are left
// out of the line rather than drawn as zero.
export function trendSeries(measure: MeasureValueDto): number[] {
  return [...measure.history]
    .reverse()
    .concat(measure.value)
    .filter((value): value is number => value !== null);
}

export type MedianStanding = 'above' | 'below' | 'level' | 'unknown';

// Where the company sits against its industry median. Deliberately not "better" or "worse":
// whether higher is good depends on the measure and the reader (decision 52).
export function standingAgainstMedian(measure: MeasureValueDto): MedianStanding {
  if (measure.value === null || measure.industryMedian === null) return 'unknown';
  const gap = measure.value - measure.industryMedian;
  const tolerance = Math.max(Math.abs(measure.industryMedian) * 0.05, 0.05);
  if (Math.abs(gap) <= tolerance) return 'level';
  return gap > 0 ? 'above' : 'below';
}

export const STANDING_LABEL: Readonly<Record<MedianStanding, string>> = {
  above: 'Above median',
  below: 'Below median',
  level: 'Near median',
  unknown: 'No comparison',
};
