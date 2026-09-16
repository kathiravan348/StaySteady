import { Toggle } from '@staysteady/ui';
import type { ReactElement } from 'react';

import styles from './Config.module.scss';

export interface CapabilitySwitchProps {
  readonly label: string;
  readonly description: string;
  readonly isSelected: boolean;
  readonly onChange: (isSelected: boolean) => void;
  readonly isDisabled?: boolean;
}

// UI spec 7.18 — capability flags are explicit switches with what they allow, never buried settings.
export function CapabilitySwitch({
  label,
  description,
  isSelected,
  onChange,
  isDisabled = false,
}: CapabilitySwitchProps): ReactElement {
  return (
    <div className={styles.switch}>
      <Toggle isSelected={isSelected} isDisabled={isDisabled} onChange={onChange}>
        {label}
      </Toggle>
      <p className={styles.meta}>{description}</p>
    </div>
  );
}

// UI spec 7.18 — a clear indication that a new entry starts in simulation.
export function SimulationNotice({ subject }: { readonly subject: string }): ReactElement {
  return (
    <div className={styles.simulation} role="note">
      <span className={styles.note}>
        <strong>This {subject} starts in simulation.</strong>
      </span>
      <span className={styles.meta}>
        Nothing reaches a real venue until it is saved and then switched to live on purpose.
      </span>
    </div>
  );
}

export function FieldError({
  message,
}: {
  readonly message: string | undefined;
}): ReactElement | null {
  return message === undefined ? null : (
    <p className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}
