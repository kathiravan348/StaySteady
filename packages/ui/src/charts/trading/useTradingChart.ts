import {
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
  type Time,
} from 'lightweight-charts';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { paletteColor, toSeriesMarkers } from '../shared/chartColors';
import type { ChartThemeColors } from '../theme/chartThemeTokens';
import { fromLibraryTime } from './chartTime';
import { DrawingsPrimitive, type DrawingStyle } from './drawingsPrimitive';
import { formatStudyValue, ohlcLegend, type LegendState } from './legendValues';
import {
  addMainSeries,
  addStudySeries,
  candleColors,
  type MainSeriesApi,
  type StudySeriesApi,
} from './tradingSeries';
import type { ChartAnchor, TradingChartProps, TradingSeries } from './types';

export interface TradingChartApi {
  readonly zoom: (factor: number) => void;
  readonly pan: (bars: number) => void;
  readonly resetView: () => void;
  readonly screenshot: () => HTMLCanvasElement | null;
}

interface ChartParts {
  readonly chart: IChartApi;
  readonly main: MainSeriesApi;
  readonly studies: readonly { readonly definition: TradingSeries; readonly api: StudySeriesApi }[];
  readonly primitive: DrawingsPrimitive;
}

const SCALE_MODES = {
  linear: PriceScaleMode.Normal,
  log: PriceScaleMode.Logarithmic,
  percent: PriceScaleMode.Percentage,
} as const;

const drawingStyle = (colors: ChartThemeColors): DrawingStyle => ({
  stroke: paletteColor(1, colors),
  fill: colors.isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(180, 83, 9, 0.1)',
  text: colors.textColor,
  font: '12px system-ui, sans-serif',
});

const defaultFormat = (value: number): string => value.toFixed(2);

export function useTradingChart(
  containerRef: RefObject<HTMLDivElement | null>,
  props: TradingChartProps,
  colors: ChartThemeColors,
  subPaneHeights: readonly number[],
): {
  readonly hover: LegendState | null;
  readonly pendingAnchor: ChartAnchor | null;
  readonly api: TradingChartApi;
} {
  const { bars, style = 'candlestick', overlays, panes, height = 420 } = props;
  const partsRef = useRef<ChartParts | null>(null);
  const horizontalLinesRef = useRef<IPriceLine[]>([]);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const latestRef = useRef(props);
  latestRef.current = props;
  const pendingRef = useRef<ChartAnchor | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<ChartAnchor | null>(null);
  const [hover, setHover] = useState<LegendState | null>(null);
  const [generation, setGeneration] = useState(0);

  // Structure: recreated when the data, style or studies change.
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
      },
      grid: { vertLines: { color: colors.gridColor }, horzLines: { color: colors.gridColor } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderColor: colors.borderColor, timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: colors.borderColor },
    });
    const main = addMainSeries(chart, bars, style, colors);
    const studies = [
      ...(overlays ?? []).map((definition) => ({
        definition,
        api: addStudySeries(chart, definition, colors, 0),
      })),
      ...(panes ?? []).flatMap((pane, index) =>
        pane.series.map((definition) => {
          const api = addStudySeries(chart, definition, colors, index + 1);
          if (definition === pane.series[0]) {
            (pane.guides ?? []).forEach((guide) => {
              api.createPriceLine({
                price: guide,
                color: colors.borderColor,
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: '',
              });
            });
          }
          return { definition, api };
        }),
      ),
    ];
    chart.panes().forEach((pane, index) => {
      const subHeight = subPaneHeights[index - 1];
      if (index > 0 && subHeight !== undefined) pane.setHeight(subHeight);
    });
    const primitive = new DrawingsPrimitive(drawingStyle(colors));
    main.attachPrimitive(primitive);

    const sources = new Map<unknown, TradingSeries | 'main'>([
      [main, 'main'],
      ...studies.map((study) => [study.api, study.definition] as const),
    ]);
    chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
      if (param.time === undefined) {
        setHover(null);
        return;
      }
      const format = latestRef.current.formatPrice ?? defaultFormat;
      const values: LegendState['values'][number][] = [];
      param.seriesData.forEach((data, api) => {
        const source = sources.get(api);
        if (source === 'main') {
          if ('open' in data) values.unshift(...ohlcLegend(data, format));
          else if ('value' in data) values.unshift({ label: 'C', value: format(data.value) });
        } else if (source !== undefined && 'value' in data) {
          values.push({
            label: source.label,
            value: formatStudyValue(source, data.value, format),
            colorIndex: source.colorIndex,
          });
        }
      });
      setHover({ time: fromLibraryTime(param.time), values });
    });

    chart.subscribeClick((param: MouseEventParams<Time>) => {
      const { activeTool, onDrawingDraft } = latestRef.current;
      if (
        activeTool == null ||
        onDrawingDraft === undefined ||
        param.time === undefined ||
        param.point === undefined
      )
        return;
      if (param.paneIndex !== undefined && param.paneIndex !== 0) return;
      const price = main.coordinateToPrice(param.point.y);
      if (price === null) return;
      const anchor: ChartAnchor = { time: fromLibraryTime(param.time), price };
      if (activeTool === 'horizontal') {
        onDrawingDraft({ kind: 'horizontal', price });
      } else if (activeTool === 'text') {
        onDrawingDraft({ kind: 'text', at: anchor });
      } else if (pendingRef.current === null) {
        pendingRef.current = anchor;
        setPendingAnchor(anchor);
      } else {
        const from = pendingRef.current;
        pendingRef.current = null;
        setPendingAnchor(null);
        onDrawingDraft({ kind: activeTool, from, to: anchor });
      }
    });

    partsRef.current = { chart, main, studies, primitive };
    setGeneration((value) => value + 1);
    return () => {
      partsRef.current = null;
      markersRef.current = null;
      horizontalLinesRef.current = [];
      chart.remove();
    };
  }, [bars, style, overlays, panes, height, subPaneHeights.join(',')]);

  // Theme changes restyle the existing chart so zoom and pan are kept.
  useEffect(() => {
    const parts = partsRef.current;
    if (parts === null) return;
    parts.chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
      },
      grid: { vertLines: { color: colors.gridColor }, horzLines: { color: colors.gridColor } },
      timeScale: { borderColor: colors.borderColor },
      rightPriceScale: { borderColor: colors.borderColor },
    });
    if (style === 'candlestick' || style === 'hollow')
      parts.main.applyOptions(candleColors(style, colors));
    parts.studies.forEach(({ definition, api }) => {
      api.applyOptions({ color: paletteColor(definition.colorIndex, colors) });
    });
  }, [colors, generation, style]);

  useEffect(() => {
    partsRef.current?.chart
      .priceScale('right')
      .applyOptions({ mode: SCALE_MODES[props.priceScale ?? 'linear'] });
  }, [props.priceScale, generation]);

  useEffect(() => {
    const parts = partsRef.current;
    if (parts === null) return;
    const markers = toSeriesMarkers(props.markers ?? [], colors);
    if (markersRef.current === null) markersRef.current = createSeriesMarkers(parts.main, markers);
    else markersRef.current.setMarkers(markers);
  }, [props.markers, colors, generation]);

  useEffect(() => {
    const parts = partsRef.current;
    if (parts === null) return;
    const drawings = props.drawings ?? [];
    parts.primitive.update(drawings, pendingAnchor, drawingStyle(colors));
    horizontalLinesRef.current.forEach((line) => {
      parts.main.removePriceLine(line);
    });
    horizontalLinesRef.current = drawings.flatMap((drawing) =>
      drawing.kind === 'horizontal'
        ? [
            parts.main.createPriceLine({
              price: drawing.price,
              color: paletteColor(1, colors),
              lineWidth: 1,
              lineStyle: LineStyle.Solid,
              axisLabelVisible: true,
              title: 'Level',
            }),
          ]
        : [],
    );
  }, [props.drawings, pendingAnchor, colors, generation]);

  // Switching tools abandons a half-finished trend line or rectangle.
  useEffect(() => {
    pendingRef.current = null;
    setPendingAnchor(null);
  }, [props.activeTool]);

  const api = useMemo<TradingChartApi>(() => {
    const resetView = (): void => {
      const parts = partsRef.current;
      if (parts === null) return;
      const count = latestRef.current.visibleBarCount;
      const total = latestRef.current.bars.length;
      if (count == null || count >= total) parts.chart.timeScale().fitContent();
      else parts.chart.timeScale().setVisibleLogicalRange({ from: total - count, to: total + 2 });
    };
    return {
      resetView,
      zoom: (factor) => {
        const timeScale = partsRef.current?.chart.timeScale();
        const range = timeScale?.getVisibleLogicalRange();
        if (timeScale === undefined || range == null) return;
        const middle = (range.from + range.to) / 2;
        const half = Math.max(5, ((range.to - range.from) / 2) * factor);
        timeScale.setVisibleLogicalRange({ from: middle - half, to: middle + half });
      },
      pan: (barCount) => {
        const timeScale = partsRef.current?.chart.timeScale();
        if (timeScale === undefined) return;
        timeScale.scrollToPosition(timeScale.scrollPosition() + barCount, false);
      },
      screenshot: () => partsRef.current?.chart.takeScreenshot() ?? null,
    };
  }, []);

  useEffect(() => {
    api.resetView();
  }, [api, props.visibleBarCount, generation]);

  return { hover, pendingAnchor, api };
}
