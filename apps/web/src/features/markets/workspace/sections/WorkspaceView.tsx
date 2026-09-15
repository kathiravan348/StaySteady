import { EmptyState, ErrorState, LoadingState, TradingChart } from '@staysteady/ui';
import type { ChartAnchor, ChartTime, DrawingDraft, DrawingTool } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import {
  useCalendarEvents,
  useCorporateActions,
  useNewsItems,
  usePriceHistories,
  useQuotes,
} from '../../../../data/api';
import type { InstrumentDto, MarketDto } from '../../../../data/schemas';
import { formatDateTime, formatIsoDate, humanizeToken } from '../../../../shared/format';
import { toIsoDate, toIsoUtcTimestamp } from '../../../../shared/types/dateTime';
import { PriceFreshnessBar } from '../../../../shared/ui/PriceFreshnessBar';
import { collectChartEvents, eventMarkers } from '../model/chartEvents';
import { pointsToCsv } from '../model/chartData';
import { buildStudies } from '../model/studies';
import type { WorkspaceDrawing } from '../model/workspaceLayout';
import { isIntraday, TIMEFRAME_LABELS, visibleBarsFor } from '../model/workspaceLayout';
import { useWorkspaceChartData } from '../useWorkspaceData';
import { useWorkspaceLayout } from '../useWorkspaceLayout';
import styles from '../WorkspacePage.module.scss';
import { ChartSettingsBar } from './ChartSettingsBar';
import { ChartToolsBar } from './ChartToolsBar';
import { InfoPanel } from './InfoPanel';
import { InstrumentPanel } from './InstrumentPanel';
import { EventStrip } from './EventStrip';
import { TextNoteDialog } from './TextNoteDialog';

export interface WorkspaceViewProps {
  readonly instrument: InstrumentDto;
  readonly market: MarketDto | null;
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
}

const NO_DRAWINGS: readonly WorkspaceDrawing[] = [];

const decimalsOf = (tickSize: string): number => tickSize.split('.')[1]?.length ?? 0;

export function WorkspaceView({
  instrument,
  market,
  instruments,
  markets,
}: WorkspaceViewProps): ReactElement {
  const { layout, source, update, setDrawings, saveAsTypeDefault, reset } = useWorkspaceLayout(
    instrument.id,
    instrument.type,
  );
  const { chart, daily } = useWorkspaceChartData(instrument, market, layout.timeframe);
  const [tool, setTool] = useState<DrawingTool | null>(null);
  const [textAnchor, setTextAnchor] = useState<ChartAnchor | null>(null);
  const [status, setStatus] = useState('');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const intraday = isIntraday(layout.timeframe);
  const today = new Date().toISOString().slice(0, 10);

  const compareInstrument = intraday
    ? undefined
    : instruments.find((item) => item.id === layout.compareInstrumentId);
  const compareIds = useMemo(
    () => (compareInstrument === undefined ? [] : [compareInstrument.id]),
    [compareInstrument],
  );
  const compareHistory = usePriceHistories(compareIds);
  const quoteIds = useMemo(() => [instrument.id], [instrument.id]);
  const quote = useQuotes(quoteIds).data?.find((item) => item.instrumentId === instrument.id);
  const actions = useCorporateActions(instrument.id);
  const news = useNewsItems();
  const calendar = useCalendarEvents();

  const points = chart.status === 'ready' ? chart.data.points : null;
  const compareBars =
    compareInstrument === undefined
      ? undefined
      : compareHistory.histories.get(compareInstrument.id);
  const studies = useMemo(() => {
    if (points === null) return null;
    const compare =
      compareInstrument === undefined || compareBars === undefined
        ? null
        : {
            label: compareInstrument.symbol,
            points: compareBars.map((bar) => ({
              time: bar.timestamp.slice(0, 10),
              close: Number(bar.close),
            })),
          };
    return buildStudies(points, layout.indicators, compare);
  }, [points, layout.indicators, compareInstrument, compareBars]);

  const events = useMemo(
    () => collectChartEvents(instrument, actions.data ?? [], news.data ?? [], calendar.data ?? []),
    [instrument, actions.data, news.data, calendar.data],
  );
  const markers = useMemo(
    () =>
      points === null || intraday || !layout.showEvents
        ? []
        : eventMarkers(
            events,
            points.map((point) => String(point.time)),
          ),
    [points, intraday, layout.showEvents, events],
  );

  const drawings = layout.drawings[layout.timeframe] ?? NO_DRAWINGS;
  const heldMarketIds = useMemo(() => new Set([instrument.marketId]), [instrument.marketId]);
  const decimals = decimalsOf(instrument.tickSize);
  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return (value: number): string => formatter.format(value);
  }, [decimals]);
  const formatTime = (time: ChartTime): string =>
    typeof time === 'number'
      ? formatDateTime(toIsoUtcTimestamp(new Date(time * 1000)), { includeSeconds: false })
      : formatIsoDate(toIsoDate(time));

  const addDrawing = (draft: DrawingDraft): void => {
    const id = `drawing-${crypto.randomUUID()}`;
    if (draft.kind === 'text') {
      setTextAnchor(draft.at);
      return;
    }
    setDrawings(layout.timeframe, [
      ...drawings,
      draft.kind === 'horizontal'
        ? { id, kind: 'horizontal', price: draft.price }
        : { id, kind: draft.kind, from: draft.from, to: draft.to },
    ]);
  };

  const copyData = (): void => {
    if (points === null) return;
    navigator.clipboard
      .writeText(pointsToCsv(points))
      .then(() => setStatus(`Copied ${points.length} bars as CSV`))
      .catch(() => setStatus('Copy failed: the clipboard is not available'));
  };

  let chartBody: ReactElement;
  if (chart.status === 'loading' || (chart.status === 'ready' && studies === null)) {
    chartBody = <LoadingState layout="table" count={6} />;
  } else if (chart.status === 'error') {
    chartBody = (
      <ErrorState title="Chart data unavailable" message={chart.message} onRetry={chart.retry} />
    );
  } else if (chart.status === 'empty' || studies === null) {
    chartBody = (
      <EmptyState
        title="No price history"
        description={`No bars are available for ${instrument.symbol} at this timeframe.`}
      />
    );
  } else {
    chartBody = (
      <TradingChart
        bars={chart.data.bars}
        style={layout.style}
        priceScale={compareInstrument === undefined ? layout.priceScale : 'percent'}
        mainLabel={`${instrument.symbol} · ${TIMEFRAME_LABELS[layout.timeframe]}`}
        overlays={studies.overlays}
        panes={studies.panes}
        markers={markers}
        drawings={drawings}
        activeTool={tool}
        onDrawingDraft={addDrawing}
        formatPrice={formatPrice}
        formatTime={formatTime}
        height={420}
        visibleBarCount={visibleBarsFor(layout.range, layout.timeframe)}
        ariaLabel={`${instrument.symbol} ${TIMEFRAME_LABELS[layout.timeframe].toLowerCase()} price chart, ${chart.data.points.length} bars${
          intraday ? ', extended hours shown muted' : ''
        }`}
      />
    );
  }

  const layoutClass = [
    styles.workspace,
    !leftOpen && styles.leftCollapsed,
    !rightOpen && styles.rightCollapsed,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.page}>
      <PriceFreshnessBar
        oldestQuoteTimestamp={quote?.timestamp ?? null}
        heldMarketIds={heldMarketIds}
      />
      <div className={styles.panelToggles}>
        <button
          type="button"
          className={styles.toolButton}
          aria-expanded={leftOpen}
          aria-controls="workspace-instruments"
          onClick={() => setLeftOpen((open) => !open)}
        >
          {leftOpen ? 'Hide instruments' : 'Show instruments'}
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-expanded={rightOpen}
          aria-controls="workspace-details"
          onClick={() => setRightOpen((open) => !open)}
        >
          {rightOpen ? 'Hide details' : 'Show details'}
        </button>
      </div>
      <div className={layoutClass}>
        {leftOpen && (
          <InstrumentPanel
            id="workspace-instruments"
            instruments={instruments}
            markets={markets}
            currentId={instrument.id}
          />
        )}
        <div className={styles.main}>
          <ChartSettingsBar
            layout={layout}
            isComparing={compareInstrument !== undefined}
            onChange={update}
          />
          <ChartToolsBar
            layout={layout}
            instruments={instruments}
            currentId={instrument.id}
            onChange={update}
            activeTool={tool}
            onToolChange={setTool}
            drawingCount={drawings.length}
            onClearDrawings={() => setDrawings(layout.timeframe, [])}
            onCopyData={copyData}
            onSaveTypeDefault={() =>
              setStatus(
                saveAsTypeDefault()
                  ? `Saved as the default for ${humanizeToken(instrument.type)}`
                  : 'Could not save: storage unavailable',
              )
            }
            onReset={() => {
              reset();
              setStatus('Layout reset');
            }}
            typeLabel={humanizeToken(instrument.type)}
            layoutSource={source}
            status={status}
          />
          {chartBody}
          <EventStrip events={events} today={today} />
        </div>
        {rightOpen && (
          <InfoPanel id="workspace-details" instrument={instrument} quote={quote} daily={daily} />
        )}
      </div>
      {textAnchor !== null && (
        <TextNoteDialog
          onSave={(text) =>
            setDrawings(layout.timeframe, [
              ...drawings,
              { id: `drawing-${crypto.randomUUID()}`, kind: 'text', at: textAnchor, text },
            ])
          }
          onClose={() => setTextAnchor(null)}
        />
      )}
    </div>
  );
}
