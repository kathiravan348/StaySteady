import type { ReactElement, ReactNode } from 'react';
import { DropZone, isTextDropItem } from 'react-aria-components';

import { cx } from '../../utils/cx';
import styles from './ReorderableList.module.scss';

export interface DropTargetProps {
  // Accepts rows dragged from a ReorderableList with the same drag type.
  readonly dragType: string;
  readonly onDropKeys: (keys: readonly string[]) => void;
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function DropTarget({
  dragType,
  onDropKeys,
  ariaLabel,
  children,
  className,
}: DropTargetProps): ReactElement {
  return (
    <DropZone
      aria-label={ariaLabel}
      className={({ isDropTarget }) =>
        cx(styles.dropTarget, isDropTarget && styles.dropTargetActive, className)
      }
      getDropOperation={(types) => (types.has(dragType) ? 'move' : 'cancel')}
      onDrop={(event) => {
        const texts = event.items
          .filter(isTextDropItem)
          .filter((item) => item.types.has(dragType))
          .map((item) => item.getText(dragType));
        void Promise.all(texts).then((keys) => {
          if (keys.length > 0) onDropKeys(keys);
        });
      }}
    >
      {children}
    </DropZone>
  );
}
