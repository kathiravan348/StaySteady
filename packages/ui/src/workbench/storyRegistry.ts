import { chartStories } from './stories/chartStories';
import { compositesStories } from './stories/compositesStories';
import { dataDisplayStories } from './stories/dataDisplayStories';
import { layoutStories } from './stories/layoutStories';
import { primitivesStories } from './stories/primitivesStories';
import { reorderableListStories } from './stories/reorderableListStories';
import { stateStories } from './stories/stateStories';
import { tableStories } from './stories/tableStories';
import type { ComponentCategory, ComponentStory } from './types';

export const ALL_STORIES: readonly ComponentStory[] = [
  ...primitivesStories,
  ...compositesStories,
  ...reorderableListStories,
  ...layoutStories,
  ...dataDisplayStories,
  ...stateStories,
  ...tableStories,
  ...chartStories,
];

export const CATEGORIES: readonly ComponentCategory[] = [
  'Primitives',
  'Composites',
  'Layout',
  'Data Display',
  'State Components',
  'Data Table',
  'Charts',
];
