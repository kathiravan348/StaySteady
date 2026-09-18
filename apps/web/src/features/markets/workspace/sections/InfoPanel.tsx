import type { ReactElement } from 'react';

import type { InstrumentDto, MarketQuoteDto, PriceBarDto } from '../../../../data/schemas';
import { CompanySummaryCard } from '../../../../shared/ui/CompanySummaryCard';
import styles from '../WorkspacePage.module.scss';
import { InstrumentNewsSection, SignalsSection } from './ActivitySections';
import { QuoteSection } from './QuoteSection';
import { FundamentalsSection, PositionSection, WatchlistSection } from './ResearchSections';

export interface InfoPanelProps {
  readonly id: string;
  readonly instrument: InstrumentDto;
  readonly quote: MarketQuoteDto | undefined;
  readonly daily: readonly PriceBarDto[] | null;
}

// UI spec 7.4 — collapsible right info panel. Each section loads and fails on its own.
export function InfoPanel({ id, instrument, quote, daily }: InfoPanelProps): ReactElement {
  return (
    <aside id={id} className={styles.sidePanel} aria-label={`${instrument.symbol} details`}>
      <QuoteSection instrument={instrument} quote={quote} daily={daily} />
      <PositionSection instrumentId={instrument.id} />
      <SignalsSection instrumentId={instrument.id} />
      <CompanySummaryCard instrumentId={String(instrument.id)} showMeasures />
      <FundamentalsSection instrumentId={instrument.id} />
      <WatchlistSection instrumentId={instrument.id} />
      <InstrumentNewsSection instrumentId={instrument.id} />
    </aside>
  );
}
