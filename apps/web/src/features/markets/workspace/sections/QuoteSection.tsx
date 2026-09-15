import { Card, KeyValuePair, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { InstrumentDto, MarketQuoteDto, PriceBarDto } from '../../../../data/schemas';
import {
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercent,
} from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import { trailingStats } from '../model/quoteStats';
import styles from '../WorkspacePage.module.scss';

export interface QuoteSectionProps {
  readonly instrument: InstrumentDto;
  readonly quote: MarketQuoteDto | undefined;
  readonly daily: readonly PriceBarDto[] | null;
}

// UI spec 7.4 right panel — open, high, low, last, previous close, volume, day and period range.
export function QuoteSection({ instrument, quote, daily }: QuoteSectionProps): ReactElement {
  const stats = useMemo(() => (daily === null ? null : trailingStats(daily)), [daily]);
  const code = { showCurrency: 'code' } as const;
  const money = (value: MarketQuoteDto['lastPrice']): string =>
    formatMoney(moneyFromDto(value), code);

  if (quote === undefined) {
    return (
      <Card title="Quote">
        <LoadingState layout="table" count={4} />
      </Card>
    );
  }
  return (
    <Card title="Quote">
      <div className={styles.keyValues}>
        <KeyValuePair label="Last" value={money(quote.lastPrice)} isMono />
        <KeyValuePair
          label="Change"
          value={`${formatSignedMoney(moneyFromDto(quote.change))} (${formatSignedPercent(quote.changePercent)})`}
          isMono
        />
        <KeyValuePair label="Open" value={money(quote.open)} isMono />
        <KeyValuePair label="High" value={money(quote.high)} isMono />
        <KeyValuePair label="Low" value={money(quote.low)} isMono />
        <KeyValuePair label="Previous close" value={money(quote.previousClose)} isMono />
        <KeyValuePair
          label="Bid / ask"
          value={`${money(quote.bid)} / ${money(quote.ask)}`}
          isMono
        />
        <KeyValuePair label="Volume" value={formatNumber(quote.volume, { decimals: 0 })} isMono />
        <KeyValuePair
          label="Day range"
          value={`${money(quote.low)} – ${money(quote.high)}`}
          isMono
        />
        {stats !== null && (
          <>
            <KeyValuePair
              label={`${stats.barCount >= 252 ? '52-week' : `${stats.barCount}-day`} range`}
              value={`${formatMoney(createMoney(stats.low, instrument.currency), code)} – ${formatMoney(
                createMoney(stats.high, instrument.currency),
                code,
              )}`}
              isMono
            />
            <KeyValuePair
              label="Average daily volume"
              value={formatNumber(stats.averageVolume, { decimals: 0 })}
              isMono
            />
          </>
        )}
      </div>
    </Card>
  );
}
