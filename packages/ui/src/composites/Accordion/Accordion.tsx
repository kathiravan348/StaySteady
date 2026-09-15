import { useState, type ReactElement, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Accordion.module.scss';

export interface AccordionItemConfig {
  readonly id: string;
  readonly title: string;
  readonly content: ReactNode;
  readonly isDisabled?: boolean;
}

export interface AccordionProps {
  readonly items: readonly AccordionItemConfig[];
  readonly defaultExpandedIds?: readonly string[];
  readonly allowMultiple?: boolean;
  readonly className?: string;
}

export function Accordion({
  items,
  defaultExpandedIds = [],
  allowMultiple = false,
  className,
}: AccordionProps): ReactElement {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set(defaultExpandedIds));

  const toggle = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cx(styles.accordion, className)}>
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              disabled={item.isDisabled}
              aria-expanded={isExpanded}
              onClick={() => toggle(item.id)}
              className={styles.header}
            >
              <span>{item.title}</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={styles.chevron}
                data-expanded={isExpanded}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isExpanded && <div className={styles.panel}>{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
