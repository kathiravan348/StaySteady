// Planning labels and helpers (UI spec 7.17).

import type { BadgeVariant } from '@staysteady/ui';

import type {
  AllocationDimensionDto,
  AllocationPlanInput,
  AllocationRowDto,
} from '../../../data/schemas';

export const DIMENSION_LABELS: Readonly<Record<AllocationDimensionDto, string>> = {
  type: 'Instrument type',
  country: 'Country',
  currency: 'Currency',
  sector: 'Sector',
};

export const DIMENSION_OPTIONS: readonly AllocationDimensionDto[] = [
  'type',
  'country',
  'currency',
  'sector',
];

export const STATUS: Readonly<
  Record<AllocationRowDto['status'], { label: string; variant: BadgeVariant }>
> = {
  within: { label: 'Within tolerance', variant: 'positive' },
  over: { label: 'Over target', variant: 'warning' },
  under: { label: 'Under target', variant: 'warning' },
  untargeted: { label: 'No target', variant: 'neutral' },
};

export function driftText(row: AllocationRowDto): string {
  if (row.driftPercent === null) return '—';
  const sign = row.driftPercent > 0 ? '+' : '';
  return `${sign}${row.driftPercent.toFixed(1)} pts`;
}

// Draft targets for one dimension, as editable text so an emptied box is not silently zero.
export type TargetDraft = Readonly<Record<string, string>>;

export function draftFor(
  plan: AllocationPlanInput,
  dimension: AllocationDimensionDto,
): TargetDraft {
  return Object.fromEntries(
    plan.targets
      .filter((target) => target.dimension === dimension)
      .map((target) => [target.key, String(target.targetPercent)]),
  );
}

export interface DraftCheck {
  readonly total: number;
  readonly error: string | null;
}

// The same rules the server applies: numbers from 0 to 100, adding up to 100 unless all are empty.
export function checkDraft(draft: TargetDraft): DraftCheck {
  const entries = Object.values(draft).filter((value) => value.trim() !== '');
  if (entries.length === 0) return { total: 0, error: null };
  const numbers = entries.map(Number);
  if (numbers.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    return { total: 0, error: 'Each target must be a number from 0 to 100.' };
  }
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return {
    total,
    error:
      Math.abs(total - 100) > 0.01
        ? `Targets add up to ${total.toFixed(1)}%; they must add up to 100%.`
        : null,
  };
}

export function applyDraft(
  plan: AllocationPlanInput,
  dimension: AllocationDimensionDto,
  draft: TargetDraft,
  tolerancePercent: number,
): AllocationPlanInput {
  const others = plan.targets.filter((target) => target.dimension !== dimension);
  const mine = Object.entries(draft)
    .filter(([, value]) => value.trim() !== '')
    .map(([key, value]) => ({ dimension, key, targetPercent: Number(value) }));
  return { tolerancePercent, targets: [...others, ...mine] };
}
