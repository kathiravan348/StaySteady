// Lookup over the classification index, shared by every screen that groups or labels rows by
// sector, industry or business group (R-02; standards 8: features never import each other).

import type { ClassificationIndexRowDto } from '../../data/schemas/classification';

export const UNCLASSIFIED_LABEL = 'Not classified';
export const NO_GROUP_LABEL = 'No group';

export interface ClassificationLookup {
  readonly row: (instrumentId: string) => ClassificationIndexRowDto | undefined;
  // A company shows its sector. A fund or a commodity shows its asset class, which says more than
  // "Not classified" does; a fund's real sector exposure needs look-through (R-03).
  readonly sectorLabel: (instrumentId: string) => string;
  readonly industryLabel: (instrumentId: string) => string;
  readonly groupLabel: (instrumentId: string) => string;
  readonly isEmpty: boolean;
}

export function createClassificationLookup(
  rows: readonly ClassificationIndexRowDto[],
): ClassificationLookup {
  const byId = new Map(rows.map((row) => [String(row.instrumentId), row]));
  const row = (instrumentId: string): ClassificationIndexRowDto | undefined =>
    byId.get(instrumentId);
  return {
    row,
    sectorLabel: (instrumentId) => {
      const found = row(instrumentId);
      return found?.sectorName ?? found?.assetClass ?? UNCLASSIFIED_LABEL;
    },
    industryLabel: (instrumentId) => {
      const found = row(instrumentId);
      return found?.industryName ?? found?.assetClass ?? UNCLASSIFIED_LABEL;
    },
    groupLabel: (instrumentId) => row(instrumentId)?.groupName ?? NO_GROUP_LABEL,
    isEmpty: rows.length === 0,
  };
}
