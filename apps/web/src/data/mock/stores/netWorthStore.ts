// In-memory manual asset register for the page load (decisions 33 and 37).

import type { ManualAssetDto } from '../../schemas';
import { seedManualAssets } from '../generators';

let assets: ManualAssetDto[] | null = null;

export const getManualAssets = (): ManualAssetDto[] =>
  (assets ??= seedManualAssets(new Date().toISOString().slice(0, 10)));

export const setManualAssets = (next: ManualAssetDto[]): void => {
  assets = next;
};
