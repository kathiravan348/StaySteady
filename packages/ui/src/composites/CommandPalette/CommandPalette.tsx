import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import styles from './CommandPalette.module.scss';

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly category?: string;
  readonly icon?: ReactNode;
  readonly shortcut?: string;
  readonly onSelect: () => void;
}

export interface CommandPaletteProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly items: readonly CommandItem[];
  readonly placeholder?: string;
}

export function CommandPalette({
  isOpen,
  onOpenChange,
  items,
  placeholder = 'Type a command or search...',
}: CommandPaletteProps): ReactElement | null {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        (item.category && item.category.toLowerCase().includes(lower)),
    );
  }, [items, query]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdropButton}
        onClick={() => onOpenChange(false)}
        tabIndex={-1}
        aria-label="Close command palette"
      />
      <div className={styles.palette} role="dialog" aria-modal="true">
        <div className={styles.searchBar}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={placeholder}
            className={styles.searchInput}
          />
          <span className={styles.kbd}>ESC</span>
        </div>
        <div className={styles.list}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>No commands found.</div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                data-active={idx === activeIndex}
                onClick={() => {
                  item.onSelect();
                  onOpenChange(false);
                }}
                className={styles.item}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.icon}
                  {item.label}
                </span>
                {item.shortcut && <span className={styles.kbd}>{item.shortcut}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
