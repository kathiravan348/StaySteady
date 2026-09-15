import type { ReactElement, ReactNode } from 'react';
import {
  Button as RACButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
} from 'react-aria-components';

import { cx } from '../../utils/cx';
import styles from './ReorderableList.module.scss';

export type ReorderPosition = 'before' | 'after';

export interface ReorderableListProps<T extends object> {
  readonly items: readonly T[];
  readonly getKey: (item: T) => string;
  // Plain text for type-ahead, drag previews and screen readers.
  readonly getTextValue: (item: T) => string;
  readonly renderItem: (item: T) => ReactNode;
  readonly ariaLabel: string;
  // Custom drag type so DropTarget elsewhere on the page can accept these rows.
  readonly dragType: string;
  readonly onReorder: (
    movedKeys: readonly string[],
    targetKey: string,
    position: ReorderPosition,
  ) => void;
  readonly renderEmptyState?: () => ReactNode;
  readonly className?: string;
  readonly itemClassName?: string;
}

// Rows can be reordered by dragging the handle, or with the keyboard: focus the handle, press
// Enter, press Tab or the arrow keys to choose a position and press Enter to drop (Escape
// cancels). React Aria announces each step to screen readers.
export function ReorderableList<T extends object>({
  items,
  getKey,
  getTextValue,
  renderItem,
  ariaLabel,
  dragType,
  onReorder,
  renderEmptyState,
  className,
  itemClassName,
}: ReorderableListProps<T>): ReactElement {
  const { dragAndDropHooks } = useDragAndDrop<T>({
    getItems: (keys) =>
      [...keys].map((key) => {
        const item = items.find((candidate) => getKey(candidate) === String(key));
        return {
          [dragType]: String(key),
          'text/plain': item === undefined ? String(key) : getTextValue(item),
        };
      }),
    onReorder: (event) => {
      if (event.target.dropPosition === 'on') return;
      onReorder([...event.keys].map(String), String(event.target.key), event.target.dropPosition);
    },
    renderDropIndicator: (target) => (
      <DropIndicator target={target} className={styles.dropIndicator ?? ''} />
    ),
  });

  return (
    <GridList
      aria-label={ariaLabel}
      items={items}
      dragAndDropHooks={dragAndDropHooks}
      className={cx(styles.list, className)}
      {...(renderEmptyState === undefined ? {} : { renderEmptyState })}
    >
      {(item) => {
        const text = getTextValue(item);
        return (
          <GridListItem
            id={getKey(item)}
            textValue={text}
            className={({ isDragging, isFocusVisible }) =>
              cx(
                styles.item,
                isDragging && styles.dragging,
                isFocusVisible && styles.focused,
                itemClassName,
              )
            }
          >
            <RACButton slot="drag" className={styles.handle ?? ''} aria-label={`Reorder ${text}`}>
              <span aria-hidden="true">⠿</span>
            </RACButton>
            {renderItem(item)}
          </GridListItem>
        );
      }}
    </GridList>
  );
}
