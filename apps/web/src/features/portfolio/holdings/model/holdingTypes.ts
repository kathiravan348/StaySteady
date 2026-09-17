// Holdings view model types (UI spec 7.2).

import type { Liquidity } from '../../../../shared/liquidity/liquidityClass';
import type { InstrumentDto } from '../../../../data/schemas';
import type { NumberDirection } from '../../../../shared/format';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { Money } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';

export type BaseMoney = Money<BaseCurrencyCode>;

// Requirements 18 — holding-period tax treatment, per lot and per position.
export type TaxStatus =
  | { readonly kind: 'not-applicable' }
  | { readonly kind: 'short-term'; readonly daysToLongTerm: number }
  | { readonly kind: 'approaching'; readonly daysToLongTerm: number }
  | { readonly kind: 'long-term' }
  | { readonly kind: 'mixed'; readonly longTermLots: number; readonly totalLots: number };

export type ExitProximity = 'near' | 'watch' | 'clear';

export interface ExitInfo {
  readonly level: Money;
  // How far the price is above the exit level, as a percentage of the price.
  readonly distancePercent: number;
  readonly proximity: ExitProximity;
}

export interface LotView {
  readonly id: string;
  readonly purchaseDate: string;
  readonly quantity: number;
  readonly costPerUnit: Money;
  readonly daysHeld: number;
  readonly tax: TaxStatus;
}

export interface HoldingRow {
  readonly id: string;
  readonly instrument: InstrumentDto;
  readonly marketName: string;
  readonly country: string;
  readonly marketState: MarketSessionState | null;
  readonly typeLabel: string;
  // Classification (R-02). A fund or commodity shows its asset class in place of a sector, and
  // anything with no business group behind it shows "No group".
  readonly sectorLabel: string;
  readonly industryLabel: string;
  readonly groupLabel: string;
  readonly brokerName: string;
  readonly strategyName: string;
  // Strategy that opened the position; null when it was opened manually.
  readonly strategyId: string | null;
  readonly quantity: number;
  readonly averageCost: Money;
  readonly lastPrice: Money;
  readonly changePercent: number;
  readonly direction: NumberDirection;
  readonly valueLocal: Money;
  readonly valueBase: BaseMoney;
  // Cost converted at each purchase date's FX rate.
  readonly costBase: BaseMoney;
  // valueBase - costBase: price movement plus currency movement.
  readonly gainBase: BaseMoney;
  readonly gainPercent: number;
  // The part of gainBase caused by exchange-rate movement since purchase (UI spec 7.2).
  readonly currencyEffectBase: BaseMoney;
  readonly weightPercent: number;
  // Position size relative to the largest holding, 0 to 1.
  readonly sizeRatio: number;
  readonly daysHeld: number;
  readonly tax: TaxStatus;
  // How quickly the position could become cash (requirements 30).
  readonly liquidity: Liquidity;
  readonly exit: ExitInfo | null;
  readonly newsStories: number;
  readonly hasHighImportanceNews: boolean;
  readonly lots: readonly LotView[];
  readonly quoteTimestamp: IsoUtcTimestamp | null;
}
