import { useEffect, useRef, type ReactElement } from 'react';
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type BarData,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
} from 'lightweight-charts';
import { cx } from '../../utils/cx';
import { toneColor, toSeriesMarkers } from '../shared/chartColors';
import { useChartTheme } from '../theme/useChartTheme';
import type { ChartTone, PriceChartLevel, PriceChartMarker, PriceChartProps } from './types';
import styles from './PriceChart.module.scss';

type MainSeriesApi = ISeriesApi<'Candlestick' | 'Bar' | 'Line' | 'Area'>;

interface TonedPriceLine {
  readonly line: IPriceLine;
  readonly tone: ChartTone;
}

const NO_MARKERS: readonly PriceChartMarker[] = [];
const NO_LEVELS: readonly PriceChartLevel[] = [];

export function PriceChart({
  data,
  volumeData,
  seriesType = 'candlestick',
  height = 420,
  showVolume = true,
  markers = NO_MARKERS,
  priceLevels = NO_LEVELS,
  ariaLabel,
  className,
}: PriceChartProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<MainSeriesApi | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const priceLinesRef = useRef<readonly TonedPriceLine[]>([]);
  const themeColors = useChartTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: themeColors.background },
        textColor: themeColors.textColor,
      },
      grid: {
        vertLines: { color: themeColors.gridColor },
        horzLines: { color: themeColors.gridColor },
      },
      crosshair: {
        vertLine: { color: themeColors.crosshairColor },
        horzLine: { color: themeColors.crosshairColor },
      },
      timeScale: {
        borderColor: themeColors.borderColor,
      },
    });
    chartRef.current = chart;

    let mainSeries: MainSeriesApi;
    if (seriesType === 'line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: themeColors.primaryColor,
        lineWidth: 2,
      });
      mainSeries.setData(data.map((d) => ({ time: d.time, value: d.close })));
    } else if (seriesType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineColor: themeColors.primaryColor,
        lineWidth: 2,
      });
      mainSeries.setData(data.map((d) => ({ time: d.time, value: d.close })));
    } else if (seriesType === 'bar') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: themeColors.upColor,
        downColor: themeColors.downColor,
      });
      const barData: BarData[] = data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      mainSeries.setData(barData);
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: themeColors.upColor,
        downColor: themeColors.downColor,
        borderUpColor: themeColors.upColor,
        borderDownColor: themeColors.downColor,
        wickUpColor: themeColors.upColor,
        wickDownColor: themeColors.downColor,
      });
      const candleData: CandlestickData[] = data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      mainSeries.setData(candleData);
    }
    mainSeriesRef.current = mainSeries;

    markersRef.current =
      markers.length > 0
        ? createSeriesMarkers(mainSeries, toSeriesMarkers(markers, themeColors))
        : null;
    priceLinesRef.current = priceLevels.map((level) => ({
      tone: level.tone,
      line: mainSeries.createPriceLine({
        id: level.id,
        price: level.price,
        color: toneColor(level.tone, themeColors),
        lineWidth: 1,
        lineStyle: level.isDashed === true ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title: level.title,
      }),
    }));

    if (showVolume && volumeData && volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: themeColors.upVolumeColor,
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume_scale',
      });
      chart.priceScale('volume_scale').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        volumeData.map((v) => ({
          time: v.time,
          value: v.value,
          color: v.color ?? themeColors.upVolumeColor,
        })),
      );
      volumeSeriesRef.current = volumeSeries;
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const width = entries[0].contentRect.width;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      markersRef.current = null;
      priceLinesRef.current = [];
    };
  }, [data, volumeData, seriesType, height, showVolume, markers, priceLevels]);

  // Update theme dynamically without re-creating the chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: themeColors.background },
        textColor: themeColors.textColor,
      },
      grid: {
        vertLines: { color: themeColors.gridColor },
        horzLines: { color: themeColors.gridColor },
      },
      crosshair: {
        vertLine: { color: themeColors.crosshairColor },
        horzLine: { color: themeColors.crosshairColor },
      },
      timeScale: {
        borderColor: themeColors.borderColor,
      },
    });

    if (mainSeriesRef.current) {
      if (seriesType === 'candlestick') {
        mainSeriesRef.current.applyOptions({
          upColor: themeColors.upColor,
          downColor: themeColors.downColor,
          borderUpColor: themeColors.upColor,
          borderDownColor: themeColors.downColor,
          wickUpColor: themeColors.upColor,
          wickDownColor: themeColors.downColor,
        });
      } else if (seriesType === 'bar') {
        mainSeriesRef.current.applyOptions({
          upColor: themeColors.upColor,
          downColor: themeColors.downColor,
        });
      }
    }

    markersRef.current?.setMarkers(toSeriesMarkers(markers, themeColors));
    priceLinesRef.current.forEach(({ line, tone }) => {
      line.applyOptions({ color: toneColor(tone, themeColors) });
    });
  }, [themeColors, seriesType, markers]);

  return (
    <div
      className={cx(styles.chartContainer, className)}
      {...(ariaLabel === undefined ? {} : { role: 'img', 'aria-label': ariaLabel })}
    >
      <div ref={containerRef} className={styles.chartCanvas} style={{ height }} />
    </div>
  );
}
