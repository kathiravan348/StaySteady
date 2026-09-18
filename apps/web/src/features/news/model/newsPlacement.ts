// Where a story sits in the shared classification (UI spec 20.2): the sectors, industries and
// business groups it touches, through the instruments it names or the group or industry it is
// tagged with, and whether it reaches a holding only through that holding's group.

import type { ClassificationIndexDto, ClassificationTaxonomyDto } from '../../../data/schemas';
import type { NewsStory } from './newsFeed';

export interface StoryPlacement {
  readonly sectorIds: ReadonlySet<string>;
  readonly industryIds: ReadonlySet<string>;
  readonly groupIds: ReadonlySet<string>;
  // Set when the story names no holding but reaches one through its group: the group's name.
  readonly heldThroughGroup: string | null;
}

export interface PlacementOption {
  readonly value: string;
  readonly label: string;
}

export interface NewsPlacements {
  readonly byStory: ReadonlyMap<string, StoryPlacement>;
  readonly sectors: readonly PlacementOption[];
  readonly industries: readonly PlacementOption[];
  readonly groups: readonly PlacementOption[];
}

export function placeStories(
  stories: readonly NewsStory[],
  index: ClassificationIndexDto,
  taxonomy: ClassificationTaxonomyDto,
  heldIds: ReadonlySet<string>,
): NewsPlacements {
  const rows = new Map(index.rows.map((row) => [String(row.instrumentId), row]));
  const sectorOfIndustry = new Map(
    taxonomy.sectors.flatMap((sector) =>
      sector.industries.map((industry) => [industry.id, sector.id] as const),
    ),
  );
  const groupNames = new Map(
    index.rows.flatMap((row) =>
      row.groupId === null || row.groupName === null ? [] : [[row.groupId, row.groupName] as const],
    ),
  );
  const heldGroups = new Set(
    [...heldIds].flatMap((id) => {
      const groupId = rows.get(id)?.groupId;
      return groupId === null || groupId === undefined ? [] : [groupId];
    }),
  );

  const byStory = new Map<string, StoryPlacement>();
  for (const story of stories) {
    const named = story.instrumentIds.flatMap((id) => {
      const row = rows.get(id);
      return row === undefined ? [] : [row];
    });
    const reports = story.reports;
    const industryIds = new Set([
      ...named.flatMap((row) => (row.industryId === null ? [] : [row.industryId])),
      ...reports.flatMap((item) => item.relatedIndustryIds ?? []),
    ]);
    const sectorIds = new Set([
      ...named.flatMap((row) => (row.sectorId === null ? [] : [row.sectorId])),
      ...[...industryIds].flatMap((id) => {
        const sectorId = sectorOfIndustry.get(id);
        return sectorId === undefined ? [] : [sectorId];
      }),
    ]);
    const groupIds = new Set([
      ...named.flatMap((row) => (row.groupId === null ? [] : [row.groupId])),
      ...reports.flatMap((item) => item.relatedGroupIds ?? []),
    ]);
    const reachedGroup = story.isHeld
      ? undefined
      : [...groupIds].find((groupId) => heldGroups.has(groupId));
    byStory.set(story.key, {
      sectorIds,
      industryIds,
      groupIds,
      heldThroughGroup:
        reachedGroup === undefined ? null : (groupNames.get(reachedGroup) ?? reachedGroup),
    });
  }

  const used = (pick: (placement: StoryPlacement) => ReadonlySet<string>): Set<string> =>
    new Set([...byStory.values()].flatMap((placement) => [...pick(placement)]));
  const usedSectors = used((placement) => placement.sectorIds);
  const usedIndustries = used((placement) => placement.industryIds);
  const usedGroups = used((placement) => placement.groupIds);

  return {
    byStory,
    sectors: taxonomy.sectors
      .filter((sector) => usedSectors.has(sector.id))
      .map((sector) => ({ value: sector.id, label: sector.name })),
    industries: taxonomy.sectors
      .flatMap((sector) => sector.industries)
      .filter((industry) => usedIndustries.has(industry.id))
      .map((industry) => ({ value: industry.id, label: industry.name })),
    groups: [...usedGroups].map((id) => ({ value: id, label: groupNames.get(id) ?? id })),
  };
}
