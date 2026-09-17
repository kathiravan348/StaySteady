import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as echarts from 'echarts';
import { cx } from '../../utils/cx';
import { useChartTheme } from '../theme/useChartTheme';
import { buildAnalyticalOption } from './buildAnalyticalOption';
import type { AnalyticalChartProps } from './types';
import styles from './AnalyticalChart.module.scss';

export function AnalyticalChart(props: AnalyticalChartProps): ReactElement {
  const { height = 360, className } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const themeColors = useChartTheme();
  const option = useMemo(() => buildAnalyticalOption(props, themeColors), [props, themeColors]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // Replaces the whole option so series removed by a data or theme change do not linger.
  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

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
