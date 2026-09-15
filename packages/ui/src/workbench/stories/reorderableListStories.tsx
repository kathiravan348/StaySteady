import { useState, type ReactElement } from 'react';

import { DropTarget } from '../../composites/ReorderableList/DropTarget';
import {
  ReorderableList,
  type ReorderPosition,
} from '../../composites/ReorderableList/ReorderableList';
import type { ComponentStory } from '../types';

interface DemoItem {
  readonly id: string;
  readonly label: string;
}

const DRAG_TYPE = 'application/x-staysteady-demo';

function reorder(
  items: readonly DemoItem[],
  moved: readonly string[],
  target: string,
  position: ReorderPosition,
): DemoItem[] {
  const movedItems = items.filter((item) => moved.includes(item.id));
  const rest = items.filter((item) => !moved.includes(item.id));
  const index = rest.findIndex((item) => item.id === target);
  const insertAt = index < 0 ? rest.length : position === 'before' ? index : index + 1;
  return [...rest.slice(0, insertAt), ...movedItems, ...rest.slice(insertAt)];
}

function ReorderableListDemo(): ReactElement {
  const [items, setItems] = useState<DemoItem[]>([
    { id: 'aapl', label: 'AAPL · Apple' },
    { id: 'nvda', label: 'NVDA · NVIDIA' },
    { id: 'azn', label: 'AZN · AstraZeneca' },
    { id: 'reliance', label: 'RELIANCE · Reliance Industries' },
  ]);
  const [parked, setParked] = useState<DemoItem[]>([]);

  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '28rem' }}>
      <ReorderableList
        items={items}
        getKey={(item) => item.id}
        getTextValue={(item) => item.label}
        renderItem={(item) => <span>{item.label}</span>}
        ariaLabel="Demo instruments"
        dragType={DRAG_TYPE}
        onReorder={(moved, target, position) =>
          setItems((current) => reorder(current, moved, target, position))
        }
      />
      <DropTarget
        dragType={DRAG_TYPE}
        ariaLabel="Parking list"
        onDropKeys={(keys) => {
          setParked((current) => [...current, ...items.filter((item) => keys.includes(item.id))]);
          setItems((current) => current.filter((item) => !keys.includes(item.id)));
        }}
      >
        <div style={{ padding: '1rem', border: '1px dashed var(--border-default)' }}>
          Drop rows here to park them: {parked.map((item) => item.label).join(', ') || 'none yet'}
        </div>
      </DropTarget>
    </div>
  );
}

export const reorderableListStories: readonly ComponentStory[] = [
  {
    id: 'reorderable-list',
    name: 'ReorderableList and DropTarget',
    category: 'Composites',
    description:
      'Accessible drag and drop: reorder rows with a pointer or keyboard (Enter on the handle, Tab to a position, Enter) and drop rows onto another target.',
    render: () => <ReorderableListDemo />,
  },
];
