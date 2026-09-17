// The net worth view (requirements 25; UI spec 19.1): manual assets and the brokerage portfolio in one
// currency, with liquidity, concentration against total net worth and the employer exposure. The
// brokerage part uses the shared portfolio valuation, so it matches Performance and Reports.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  AssetClassDto,
  InstrumentDto,
  LiquidityClassDto,
  ManualAssetDto,
  NetWorthViewSchema,
  ReportCurrencyDto,
} from '../../schemas';
import { ANNUAL_SALARY, EMPLOYER, currentAmount } from './netWorthAssets';
import type { ValuationContext } from './reportValuation';
import { daysBetween, money } from './reportValuation';
import { SECTORS } from './researchData';

type View = z.input<typeof NetWorthViewSchema>;

// Configured warning shares of total net worth (requirements 25: "a configured share").
export const CONCENTRATION_LIMITS = {
  issuer: 20,
  sector: 35,
  asset_class: 60,
  employer: 25,
} as const;

const LIQUIDITY_ORDER: readonly LiquidityClassDto[] = [
  'immediate',
  'within_month',
  'within_year',
  'locked',
];
// Values that follow a market price, even though they are recorded by hand.
const MARKET_CATEGORIES = new Set<ManualAssetDto['category']>(['employer_equity', 'gold']);

function brokerageClass(instrument: InstrumentDto): AssetClassDto {
  switch (instrument.type) {
    case 'bond':
      return 'fixed_income';
    case 'commodity':
      return instrument.symbol.startsWith('XAU') ? 'gold' : 'other';
    case 'digital_asset':
      return 'digital_asset';
    case 'currency_pair':
      return 'cash';
    case 'derivative':
      return 'other';
    default:
      return 'equity';
  }
}

const percentOf = (part: Decimal, whole: Decimal): number =>
  whole.lessThanOrEqualTo(0) ? 0 : Number(part.dividedBy(whole).times(100).toFixed(1));

export function buildNetWorthView(
  assets: readonly ManualAssetDto[],
  v: ValuationContext,
  currency: ReportCurrencyDto,
  today: string,
): View {
  const inView = (amount: Decimal, from: string): Decimal =>
    amount.times(v.fx(from, currency, today));

  const rows = assets.map((asset) => {
    const current = currentAmount(asset, today);
    const converted = inView(current, asset.currency);
    const ageDays = Math.max(0, daysBetween(asset.valuedOn, today));
    return {
      asset,
      current,
      converted,
      row: {
        asset,
        currentValue: { amount: current.toFixed(2), currency: asset.currency },
        valueInCurrency: money(
          asset.category === 'liability' ? converted.negated() : converted,
          currency,
        ),
        ageDays,
        isStale: ageDays > asset.staleAfterDays,
      },
    };
  });
  const owned = rows.filter((item) => item.asset.category !== 'liability');
  const owed = rows.filter((item) => item.asset.category === 'liability');

  const positions = v.holdings.flatMap((holding) => {
    const instrument = v.instrument(String(holding.instrumentId));
    const value = v.holdingValue(holding, today, currency);
    return instrument === undefined || value.isZero() ? [] : [{ instrument, value }];
  });
  const sum = (values: readonly Decimal[]): Decimal =>
    values.reduce((total, value) => total.plus(value), new Decimal(0));
  const brokerage = sum(positions.map((item) => item.value));
  const manualAssets = sum(owned.map((item) => item.converted));
  const liabilities = sum(owed.map((item) => item.converted));
  const totalAssets = brokerage.plus(manualAssets);
  const netWorth = totalAssets.minus(liabilities);
  const marketExposed = brokerage.plus(
    sum(
      owned
        .filter((item) => MARKET_CATEGORIES.has(item.asset.category))
        .map((item) => item.converted),
    ),
  );

  // Listed holdings settle within days, so they count as within a month.
  const liquidity = LIQUIDITY_ORDER.map((liquidityClass) => {
    const value = sum(
      owned.filter((item) => item.asset.liquidity === liquidityClass).map((item) => item.converted),
    ).plus(liquidityClass === 'within_month' ? brokerage : 0);
    return {
      liquidity: liquidityClass,
      value: money(value, currency),
      sharePercent: percentOf(value, totalAssets),
    };
  });

  const exposures = [
    ...positions.map(({ instrument, value }) => ({
      issuer: instrument.name,
      sector: SECTORS[instrument.symbol] ?? null,
      assetClass: brokerageClass(instrument),
      value,
    })),
    ...owned.map(({ asset, converted }) => ({
      issuer: asset.issuer,
      sector: asset.sector,
      assetClass: asset.assetClass,
      value: converted,
    })),
  ];
  const group = (
    kind: 'issuer' | 'sector' | 'asset_class',
    keyOf: (item: (typeof exposures)[number]) => string | null,
  ) => {
    const totals = new Map<string, Decimal>();
    exposures.forEach((item) => {
      const key = keyOf(item);
      if (key !== null) totals.set(key, (totals.get(key) ?? new Decimal(0)).plus(item.value));
    });
    const limit = CONCENTRATION_LIMITS[kind];
    return [...totals].map(([name, value]) => {
      const sharePercent = percentOf(value, netWorth);
      return {
        kind,
        name,
        value: money(value, currency),
        sharePercent,
        limitPercent: limit,
        breached: sharePercent > limit,
      };
    });
  };
  const concentration = [
    ...group('issuer', (item) => item.issuer),
    ...group('sector', (item) => item.sector),
    ...group('asset_class', (item) => item.assetClass),
  ].sort((a, b) => b.sharePercent - a.sharePercent);

  const employerRows = owned.filter(
    (item) => item.asset.category === 'employer_equity' && item.asset.issuer === EMPLOYER,
  );
  const vested = sum(employerRows.map((item) => item.converted));
  const unvested = sum(
    employerRows.map((item) =>
      inView(new Decimal(item.asset.vesting?.unvestedValue ?? 0), item.asset.currency),
    ),
  );
  const salary = inView(new Decimal(ANNUAL_SALARY.amount), ANNUAL_SALARY.currency);
  const combined = vested.plus(unvested).plus(salary);
  const combinedSharePercent = percentOf(combined, netWorth);

  return {
    currency,
    asOf: today,
    totals: {
      netWorth: money(netWorth, currency),
      assets: money(totalAssets, currency),
      liabilities: money(liabilities, currency),
      marketExposed: money(marketExposed, currency),
      nonMarket: money(totalAssets.minus(marketExposed), currency),
    },
    brokerage: { value: money(brokerage, currency), holdings: positions.length },
    assets: rows.map((item) => item.row),
    liquidity,
    concentration,
    employer:
      employerRows.length === 0
        ? null
        : {
            employer: EMPLOYER,
            vestedEquity: money(vested, currency),
            unvestedEquity: money(unvested, currency),
            annualSalary: money(salary, currency),
            combined: money(combined, currency),
            combinedSharePercent,
            limitPercent: CONCENTRATION_LIMITS.employer,
            breached: combinedSharePercent > CONCENTRATION_LIMITS.employer,
          },
  };
}
