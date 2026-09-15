import type { ReactElement, ReactNode } from 'react';
import { Switch as RACSwitch, type SwitchProps as RACSwitchProps } from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Toggle.module.scss';

export interface ToggleProps extends Omit<RACSwitchProps, 'children'> {
  readonly children?: ReactNode;
}

export function Toggle({ children, className, ...props }: ToggleProps): ReactElement {
  return (
    <RACSwitch
      {...props}
      className={(renderProps) =>
        cx(styles.switch, typeof className === 'function' ? className(renderProps) : className)
      }
    >
      <div className={styles.track}>
        <div className={styles.thumb} />
      </div>
      {children}
    </RACSwitch>
  );
}
