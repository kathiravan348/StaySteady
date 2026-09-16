import { useEffect, useRef, type ReactElement } from 'react';
import * as echarts from 'echarts';
import { cx } from '../../utils/cx';
import { useChartTheme } from '../theme/useChartTheme';
import {
  createComparisonCurvesOption,
  createDonutOption,
  createDrawdownOption,
  createEquityCurveOption,
  createMonthlyHeatmapOption,
} from './analyticalPresets';
import type {
  AnalyticalChartProps,
  ComparisonCurvesData,
  DonutData,
  DrawdownData,
  EquityCurveData,
  HeatmapData,
} from './types';
import styles from './AnalyticalChart.module.scss';

export function AnalyticalChart({
  preset = 'custom',
  options,
  data,
  height = 360,
  className,
}: AnalyticalChartProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const themeColors = useChartTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: 'canvas',
    });
    chartRef.current = chart;

    let computedOptions = options ?? {};
    if (preset === 'equity-curve' && data) {
      const d = data as EquityCurveData;
      computedOptions = createEquityCurveOption(d.dates, d.equity, d.benchmark, themeColors);
    } else if (preset === 'comparison-curves' && data) {
      const d = data as ComparisonCurvesData;
      computedOptions = createComparisonCurvesOption(d.dates, d.series, d.baseline, themeColors);
    } else if (preset === 'underwater-drawdown' && data) {
      const d = data as DrawdownData;
      computedOptions = createDrawdownOption(d.dates, d.drawdowns, themeColors);
    } else if (preset === 'allocation-donut' && data) {
      const d = data as DonutData;
      computedOptions = createDonutOption(d.items, themeColors);
    } else if (preset === 'monthly-returns-heatmap' && data) {
      const d = data as HeatmapData;
      computedOptions = createMonthlyHeatmapOption(d.years, d.months, d.data, themeColors);
    }

    chart.setOption(computedOptions, true);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [preset, options, data, height]);

  // Dynamic theme update without unmounting
  useEffect(() => {
    if (!chartRef.current) return;
    if (preset === 'equity-curve' && data) {
      const d = data as EquityCurveData;
      chartRef.current.setOption(
        createEquityCurveOption(d.dates, d.equity, d.benchmark, themeColors),
      );
    } else if (preset === 'comparison-curves' && data) {
      const d = data as ComparisonCurvesData;
      chartRef.current.setOption(
        createComparisonCurvesOption(d.dates, d.series, d.baseline, themeColors),
      );
    } else if (preset === 'underwater-drawdown' && data) {
      const d = data as DrawdownData;
      chartRef.current.setOption(createDrawdownOption(d.dates, d.drawdowns, themeColors));
    } else if (preset === 'allocation-donut' && data) {
      const d = data as DonutData;
      chartRef.current.setOption(createDonutOption(d.items, themeColors));
    } else if (preset === 'monthly-returns-heatmap' && data) {
      const d = data as HeatmapData;
      chartRef.current.setOption(
        createMonthlyHeatmapOption(d.years, d.months, d.data, themeColors),
      );
    }
  }, [themeColors, preset, data]);

  return (
    <div className={cx(styles.chartContainer, className)}>
      <div
        ref={containerRef}
        className={styles.chartCanvas}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
}
