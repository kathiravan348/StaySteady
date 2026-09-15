import { useCallback, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './SplitPanel.module.scss';

export interface SplitPanelProps {
  readonly direction?: 'horizontal' | 'vertical';
  readonly defaultRatio?: number;
  readonly minSizePixels?: number;
  readonly first: ReactNode;
  readonly second: ReactNode;
  readonly className?: string;
}

export function SplitPanel({
  direction = 'horizontal',
  defaultRatio = 0.5,
  minSizePixels = 100,
  first,
  second,
  className,
}: SplitPanelProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent): void => {
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent): void => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (direction === 'horizontal') {
        const offset = e.clientX - rect.left;
        const clamped = Math.max(minSizePixels, Math.min(rect.width - minSizePixels, offset));
        setRatio(clamped / rect.width);
      } else {
        const offset = e.clientY - rect.top;
        const clamped = Math.max(minSizePixels, Math.min(rect.height - minSizePixels, offset));
        setRatio(clamped / rect.height);
      }
    },
    [direction, minSizePixels],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent): void => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  }, []);

  const firstBasis = `${(ratio * 100).toFixed(2)}%`;
  const secondBasis = `${((1 - ratio) * 100).toFixed(2)}%`;

  return (
    <div ref={containerRef} className={cx(styles.splitPanel, styles[direction], className)}>
      <div className={styles.pane} style={{ flexBasis: firstBasis, flexShrink: 0 }}>
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={direction}
        aria-label="Resize panels"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={cx(
          styles.splitter,
          direction === 'horizontal' ? styles.horizontalSplitter : styles.verticalSplitter,
        )}
      />
      <div className={styles.pane} style={{ flexBasis: secondBasis, flexGrow: 1 }}>
        {second}
      </div>
    </div>
  );
}
