import type { ReactNode } from 'react';

export type ComponentCategory =
  | 'Primitives'
  | 'Composites'
  | 'Layout'
  | 'Data Display'
  | 'State Components'
  | 'Data Table'
  | 'Charts';

export interface ComponentStory {
  readonly id: string;
  readonly name: string;
  readonly category: ComponentCategory;
  readonly description: string;
  readonly render: () => ReactNode;
}
