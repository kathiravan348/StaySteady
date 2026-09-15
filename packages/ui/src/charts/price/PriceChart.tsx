import { useEffect, useRef, type ReactElement } from 'react';
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type BarData,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { cx } from '../../utils/cx';
import { useChartTheme } from '../theme/useChartTheme';
import type { PriceChartProps } from './types';
import styles from './PriceChart.module.scss';

type MainSeriesApi = ISeriesApi<'Candlestick' | 'Bar' | 'Line' | 'Area'>;

export function PriceChart({
  data,
  volumeData,
  seriesType = 'candlestick',
  height = 420,
  showVolume = true,
  className,
}: PriceChartProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<MainSeriesApi | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
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
    };
  }, [data, volumeData, seriesType, height, showVolume]);

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
  }, [themeColors, seriesType]);

  return (
    <div className={cx(styles.chartContainer, className)}>
      <div ref={containerRef} className={styles.chartCanvas} style={{ height }} />
    </div>
  );
}
