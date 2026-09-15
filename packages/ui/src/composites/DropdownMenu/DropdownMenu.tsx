import type { Key, ReactElement, ReactNode } from 'react';
import {
  Keyboard,
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuTrigger,
  Popover as RACPopover,
  Separator,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './DropdownMenu.module.scss';

export interface DropdownMenuItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly shortcut?: string;
  readonly isDanger?: boolean;
  readonly isDisabled?: boolean;
  readonly isSeparator?: boolean;
}

export interface DropdownMenuProps {
  readonly trigger: ReactElement;
  readonly items: readonly DropdownMenuItemConfig[];
  readonly onAction?: (key: Key) => void;
  readonly className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  onAction,
  className,
}: DropdownMenuProps): ReactElement {
  return (
    <MenuTrigger>
      {trigger}
      <RACPopover className={cx(styles.popover ?? '', className)}>
        <RACMenu {...(onAction !== undefined && { onAction })} className={styles.menu ?? ''}>
          {items.map((item) =>
            item.isSeparator ? (
              <Separator key={item.id} className={styles.separator ?? ''} />
            ) : (
              <RACMenuItem
                key={item.id}
                id={item.id}
                {...(item.isDisabled !== undefined && { isDisabled: item.isDisabled })}
                className={cx(styles.item ?? '', item.isDanger && (styles.danger ?? ''))}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.icon}
                  {item.label}
                </span>
                {item.shortcut && (
                  <Keyboard className={styles.shortcut ?? ''}>{item.shortcut}</Keyboard>
                )}
              </RACMenuItem>
            ),
          )}
        </RACMenu>
      </RACPopover>
    </MenuTrigger>
  );
}
