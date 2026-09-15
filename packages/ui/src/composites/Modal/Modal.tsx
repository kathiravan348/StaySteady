import type { ReactElement, ReactNode } from 'react';
import {
  Dialog as RACDialog,
  Heading as RACHeading,
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Modal.module.scss';

export interface ModalProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly title?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly isDismissable?: boolean;
  readonly className?: string;
}

export function Modal({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  isDismissable = true,
  className,
}: ModalProps): ReactElement | null {
  if (!isOpen) return null;

  return (
    <RACModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={styles.overlay ?? ''}
    >
      <RACModal className={cx(styles.modal ?? '', className)}>
        <RACDialog className={styles.dialog ?? ''}>
          {({ close }) => (
            <>
              <div className={styles.header ?? ''}>
                {title && (
                  <RACHeading slot="title" className={styles.title ?? ''}>
                    {title}
                  </RACHeading>
                )}
                {isDismissable && (
                  <button
                    type="button"
                    onClick={close}
                    className={styles.closeButton}
                    aria-label="Close dialog"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <div className={styles.body}>{children}</div>
              {footer && <div className={styles.footer}>{footer}</div>}
            </>
          )}
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  );
}
