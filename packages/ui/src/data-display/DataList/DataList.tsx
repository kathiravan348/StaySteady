import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './DataList.module.scss';

export interface DataListItemConfig {
  readonly id: string | number;
  readonly content: ReactNode;
  readonly extra?: ReactNode;
  readonly onClick?: () => void;
}

export interface DataListProps extends HTMLAttributes<HTMLUListElement> {
  readonly items: readonly DataListItemConfig[];
  readonly isDense?: boolean;
}

export function DataList({
  items,
  isDense = false,
  className,
  ...props
}: DataListProps): ReactElement {
  return (
    <ul className={cx(styles.list, className)} {...props}>
      {items.map((item) => {
        if (item.onClick) {
          return (
            <li key={item.id} className={cx(styles.item, styles.interactive)}>
              <button
                type="button"
                onClick={item.onClick}
                className={cx(styles.itemButton, isDense && styles.dense)}
              >
                <div>{item.content}</div>
                {item.extra && <div>{item.extra}</div>}
              </button>
            </li>
          );
        }

        return (
          <li key={item.id} className={cx(styles.item, isDense && styles.dense)}>
            <div>{item.content}</div>
            {item.extra && <div>{item.extra}</div>}
          </li>
        );
      })}
    </ul>
  );
}
