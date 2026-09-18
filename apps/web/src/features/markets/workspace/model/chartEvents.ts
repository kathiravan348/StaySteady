// Event markers on the time axis: dividends, splits, earnings, filings and high-impact news
// (UI spec 7.4; filings and published results added by UI spec 20.2).
// Pure.

import type { PriceChartMarker } from '@staysteady/ui';

import type {
  CalendarEventDto,
  CorporateActionDto,
  FilingDto,
  InstrumentDto,
  NewsItemDto,
} from '../../../../data/schemas';

export type ChartEventKind =
  'dividend' | 'split' | 'bonus' | 'earnings' | 'filing' | 'news' | 'other';

export interface ChartEvent {
  readonly id: string;
  readonly date: string;
  readonly kind: ChartEventKind;
  readonly label: string;
  readonly detail: string;
}

const MARKER_TEXT: Readonly<Record<ChartEventKind, string>> = {
  dividend: 'D',
  split: 'S',
  bonus: 'B',
  earnings: 'E',
  filing: 'F',
  news: 'N',
  other: '•',
};

function actionEvent(action: CorporateActionDto): ChartEvent {
  const kind: ChartEventKind =
    action.type === 'dividend'
      ? 'dividend'
      : action.type === 'split'
        ? 'split'
        : action.type === 'bonus_issue'
          ? 'bonus'
          : 'other';
  const ratio = action.ratio === undefined ? '' : ` ${action.ratio}`;
  return {
    id: action.id,
    date: action.effectiveDate,
    kind,
    label: `${action.type.replaceAll('_', ' ')}${ratio}`,
    detail: action.description,
  };
}

export function collectChartEvents(
  instrument: InstrumentDto,
  actions: readonly CorporateActionDto[],
  news: readonly NewsItemDto[],
  calendar: readonly CalendarEventDto[],
  filings: readonly FilingDto[] = [],
): ChartEvent[] {
  const seenStories = new Set<string>();
  const newsEvents = news
    .filter(
      (item) =>
        item.importance === 'high' && item.relatedInstruments.some((id) => id === instrument.id),
    )
    .filter((item) => {
      const key = item.duplicateGroupId ?? item.id;
      const isNew = !seenStories.has(key);
      seenStories.add(key);
      return isNew;
    })
    .map((item) => ({
      id: item.id,
      date: item.publishedAt.slice(0, 10),
      kind: 'news' as const,
      label: 'High-impact news',
      detail: item.title,
    }));
  const nameWord = instrument.name.split(' ')[0] ?? instrument.symbol;
  const earnings = calendar
    .filter(
      (event) =>
        event.eventType === 'earnings' &&
        (event.instrumentId === undefined
          ? event.marketId === instrument.marketId &&
            (event.title.includes(instrument.symbol) || event.title.includes(nameWord))
          : event.instrumentId === instrument.id),
    )
    .map((event) => ({
      id: event.id,
      date: event.date,
      kind: 'earnings' as const,
      label: 'Earnings',
      detail: event.title,
    }));
  // A published results filing is a past earnings date; other filings get their own marker.
  const filed = filings.map((filing) => ({
    id: filing.id,
    date: filing.filedAt.slice(0, 10),
    kind: filing.kind === 'results' ? ('earnings' as const) : ('filing' as const),
    label: filing.kind === 'results' ? 'Results published' : 'Filing',
    detail: filing.title,
  }));
  return [...actions.map(actionEvent), ...newsEvents, ...earnings, ...filed].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

// Only events inside the charted period get a marker; later ones are listed in the event strip.
export function eventMarkers(
  events: readonly ChartEvent[],
  barDates: readonly string[],
): PriceChartMarker[] {
  const first = barDates[0];
  const last = barDates[barDates.length - 1];
  if (first === undefined || last === undefined) {
    return [];
  }
  return events.flatMap((event): PriceChartMarker[] => {
    if (event.date < first || event.date > last) {
      return [];
    }
    let time = first;
    for (const date of barDates) {
      if (date > event.date) break;
      time = date;
    }
    return [
      { time, position: 'above', shape: 'circle', tone: 'neutral', text: MARKER_TEXT[event.kind] },
    ];
  });
}
