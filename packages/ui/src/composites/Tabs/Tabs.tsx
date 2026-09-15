import type { ReactElement, ReactNode } from 'react';
import {
  Tab as RACTab,
  TabList as RACTabList,
  TabPanel as RACTabPanel,
  Tabs as RACTabs,
  type Key,
  type TabsProps as RACTabsProps,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Tabs.module.scss';

export interface TabItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly badge?: ReactNode;
  readonly content: ReactNode;
  readonly isDisabled?: boolean;
}

export interface TabsProps extends Omit<
  RACTabsProps,
  'children' | 'selectedKey' | 'onSelectionChange'
> {
  readonly items: readonly TabItemConfig[];
  readonly selectedKey?: Key;
  readonly onSelectionChange?: (key: Key) => void;
}

export function Tabs({
  items,
  selectedKey,
  onSelectionChange,
  className,
  ...props
}: TabsProps): ReactElement {
  return (
    <RACTabs
      {...(selectedKey !== undefined && { selectedKey })}
      {...(onSelectionChange !== undefined && { onSelectionChange })}
      className={(renderProps) =>
        cx(styles.tabs ?? '', typeof className === 'function' ? className(renderProps) : className)
      }
      {...props}
    >
      <RACTabList className={styles.tabList ?? ''}>
        {items.map((item) => (
          <RACTab
            key={item.id}
            id={item.id}
            {...(item.isDisabled !== undefined && { isDisabled: item.isDisabled })}
            className={styles.tab ?? ''}
          >
            {item.icon}
            {item.label}
            {item.badge}
          </RACTab>
        ))}
      </RACTabList>
      {items.map((item) => (
        <RACTabPanel key={item.id} id={item.id} className={styles.tabPanel ?? ''}>
          {item.content}
        </RACTabPanel>
      ))}
    </RACTabs>
  );
}
