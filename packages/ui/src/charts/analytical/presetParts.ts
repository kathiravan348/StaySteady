import type { LegendComponentOption, TooltipComponentOption } from 'echarts';

import type { ChartThemeColors } from '../theme/chartThemeTokens';

// Building blocks shared by the analytical presets so every chart reads the same theme roles.

export function themedTooltip(
  theme: ChartThemeColors,
  trigger: 'axis' | 'item',
): TooltipComponentOption {
  return {
    trigger,
    backgroundColor: theme.tooltipBackground,
    borderColor: theme.borderColor,
    textStyle: { color: theme.textColor },
  };
}

export function themedLegend(theme: ChartThemeColors): LegendComponentOption {
  return { top: 10, textStyle: { color: theme.textColor } };
}

export function categoryAxis(data: readonly string[], theme: ChartThemeColors) {
  return {
    type: 'category' as const,
    data: [...data],
    axisLine: { lineStyle: { color: theme.borderColor } },
    axisLabel: { color: theme.textColor },
  };
}

export function valueAxis(theme: ChartThemeColors, unit?: string) {
  return {
    type: 'value' as const,
    scale: true,
    axisLine: { lineStyle: { color: theme.borderColor } },
    splitLine: { lineStyle: { color: theme.gridColor } },
    axisLabel: {
      color: theme.textColor,
      formatter: unit === undefined ? '{value}' : `{value}${unit}`,
    },
  };
}

function hexChannels(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match?.[1] === undefined) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// Blends two hex colours; t = 0 gives `from`, t = 1 gives `to`.
export function mixColor(from: string, to: string, t: number): string {
  const a = hexChannels(from);
  const b = hexChannels(to);
  if (a === null || b === null) return t < 0.5 ? from : to;
  const clamped = Math.min(1, Math.max(0, t));
  const channel = (index: 0 | 1 | 2): number =>
    Math.round(a[index] + (b[index] - a[index]) * clamped);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

// Diverging colour: loss colour below zero, neutral at zero, gain colour above, saturating at ±limit.
export function divergingColor(value: number, limit: number, theme: ChartThemeColors): string {
  const neutral = theme.gridColor;
  if (limit <= 0 || value === 0) return neutral;
  const t = Math.min(1, Math.abs(value) / limit);
  return value > 0 ? mixColor(neutral, theme.upColor, t) : mixColor(neutral, theme.downColor, t);
}
