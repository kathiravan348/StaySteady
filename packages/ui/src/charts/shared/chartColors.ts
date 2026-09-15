import type { SeriesMarker, Time } from 'lightweight-charts';

import type { ChartTone, PriceChartMarker } from '../price/types';
import type { ChartThemeColors } from '../theme/chartThemeTokens';

// Colour roles shared by PriceChart and TradingChart, resolved from the active theme.

export function toneColor(tone: ChartTone, colors: ChartThemeColors): string {
  if (tone === 'up') return colors.upColor;
  return tone === 'down' ? colors.downColor : colors.primaryColor;
}

export function volumeToneColor(tone: ChartTone, colors: ChartThemeColors): string {
  if (tone === 'up') return colors.upVolumeColor;
  return tone === 'down' ? colors.downVolumeColor : colors.mutedColor;
}

export function paletteColor(index: number, colors: ChartThemeColors): string {
  const { palette } = colors;
  return (
    palette[((index % palette.length) + palette.length) % palette.length] ?? colors.primaryColor
  );
}

export function toSeriesMarkers(
  markers: readonly PriceChartMarker[],
  colors: ChartThemeColors,
): SeriesMarker<Time>[] {
  return markers.map((marker): SeriesMarker<Time> => ({
    time: marker.time,
    position: marker.position === 'above' ? 'aboveBar' : 'belowBar',
    shape: marker.shape,
    color: toneColor(marker.tone, colors),
    ...(marker.text === undefined ? {} : { text: marker.text }),
  }));
}
