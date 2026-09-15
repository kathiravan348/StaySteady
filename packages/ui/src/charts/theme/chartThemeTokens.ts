export interface ChartThemeColors {
  readonly background: string;
  readonly textColor: string;
  readonly gridColor: string;
  readonly borderColor: string;
  readonly crosshairColor: string;
  readonly upColor: string;
  readonly downColor: string;
  readonly upVolumeColor: string;
  readonly downVolumeColor: string;
  readonly primaryColor: string;
  readonly tooltipBackground: string;
  // Distinct line colours for overlays and indicators, in a fixed order.
  readonly palette: readonly string[];
  // Muted colour for de-emphasised bars such as extended-hours sessions.
  readonly mutedColor: string;
  readonly isDark: boolean;
}

const DARK_PALETTE = ['#60a5fa', '#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#22d3ee'] as const;
const LIGHT_PALETTE = ['#2563eb', '#b45309', '#7c3aed', '#047857', '#be185d', '#0e7490'] as const;

export function resolveChartThemeColors(): ChartThemeColors {
  if (typeof window === 'undefined') {
    return {
      background: '#0f172a',
      textColor: '#94a3b8',
      gridColor: '#1e293b',
      borderColor: '#334155',
      crosshairColor: '#475569',
      upColor: '#22c55e',
      downColor: '#ef4444',
      upVolumeColor: 'rgba(34, 197, 94, 0.4)',
      downVolumeColor: 'rgba(239, 68, 68, 0.4)',
      primaryColor: '#3b82f6',
      tooltipBackground: '#1e293b',
      palette: DARK_PALETTE,
      mutedColor: 'rgba(148, 163, 184, 0.45)',
      isDark: true,
    };
  }

  const root = document.documentElement;
  const theme = root.getAttribute('data-theme') ?? 'dark';
  const isDark = theme !== 'light';
  const gainLoss = root.getAttribute('data-gain-loss') ?? 'green-up';
  const isRedUp = gainLoss === 'red-up';

  const upColor = isRedUp ? '#ef4444' : '#22c55e';
  const downColor = isRedUp ? '#22c55e' : '#ef4444';

  const background = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const crosshairColor = isDark ? '#475569' : '#cbd5e1';
  const primaryColor = '#3b82f6';
  const tooltipBackground = isDark ? '#1e293b' : '#ffffff';

  return {
    background,
    textColor,
    gridColor,
    borderColor,
    crosshairColor,
    upColor,
    downColor,
    upVolumeColor: isRedUp ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
    downVolumeColor: isRedUp ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
    primaryColor,
    tooltipBackground,
    palette: isDark ? DARK_PALETTE : LIGHT_PALETTE,
    mutedColor: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)',
    isDark,
  };
}
