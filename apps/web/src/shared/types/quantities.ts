// Branded types for numerical quantities (standards 6.4).
// Enforces clear distinctions between ratios (0.0525), percentages (5.25), and unit counts.

import type { Brand } from './brand';

export type Quantity = Brand<number, 'Quantity'>;
export type Percentage = Brand<number, 'Percentage'>;
export type Ratio = Brand<number, 'Ratio'>;
export type BasisPoints = Brand<number, 'BasisPoints'>;

function assertFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Expected finite number for ${label}, received: ${String(value)}`);
  }
  return value;
}

export function toQuantity(value: unknown): Quantity {
  const num = assertFiniteNumber(value, 'Quantity');
  return num as Quantity;
}

export function toPercentage(value: unknown): Percentage {
  const num = assertFiniteNumber(value, 'Percentage');
  return num as Percentage;
}

export function toRatio(value: unknown): Ratio {
  const num = assertFiniteNumber(value, 'Ratio');
  return num as Ratio;
}

export function toBasisPoints(value: unknown): BasisPoints {
  const num = assertFiniteNumber(value, 'BasisPoints');
  return num as BasisPoints;
}

export function percentageToRatio(percentage: Percentage): Ratio {
  return (percentage / 100) as Ratio;
}

export function ratioToPercentage(ratio: Ratio): Percentage {
  return (ratio * 100) as Percentage;
}

export function percentageToBasisPoints(percentage: Percentage): BasisPoints {
  return (percentage * 100) as BasisPoints;
}

export function basisPointsToPercentage(basisPoints: BasisPoints): Percentage {
  return (basisPoints / 100) as Percentage;
}

export function ratioToBasisPoints(ratio: Ratio): BasisPoints {
  return (ratio * 10_000) as BasisPoints;
}

export function basisPointsToRatio(basisPoints: BasisPoints): Ratio {
  return (basisPoints / 10_000) as Ratio;
}
