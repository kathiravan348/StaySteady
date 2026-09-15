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
  readonly isDark: boolean;
}

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
    isDark,
  };
}
