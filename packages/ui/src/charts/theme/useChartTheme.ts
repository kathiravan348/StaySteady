import { useEffect, useState } from 'react';
import { resolveChartThemeColors, type ChartThemeColors } from './chartThemeTokens';

export function useChartTheme(): ChartThemeColors {
  const [colors, setColors] = useState<ChartThemeColors>(resolveChartThemeColors);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateColors = (): void => {
      setColors(resolveChartThemeColors());
    };

    updateColors();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'data-theme' || mutation.attributeName === 'data-gain-loss')
        ) {
          updateColors();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-gain-loss'],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
