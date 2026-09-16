// Currency configuration seeds and health (UI spec 7.18). Rates come from the FX rates provider set up
// in S-16; conversion costs are the 0.25% charge on non-USD purchases (decision 28) and the per-market
// FX costs the backtest setup already assumes, so the numbers match those screens.

import type {
  BaseCurrencyConfigInput,
  ConfigHealthDto,
  CurrencyConfigInput,
  ProviderConfigInput,
} from '../../schemas';
import { SUPPORTED_CURRENCIES } from '../../../shared/types/currency';
import { FAULTS, FRESHNESS, FRESHNESS_DELAYS } from './healthMonitorData';
import { heldSymbols } from './instrumentTypeConfig';

type Currency = CurrencyConfigInput['currency'];

// USD is the funding currency, so converting into it costs nothing. INR, JPY and SGD use the 30 bps
// the backtest setup assumes for those markets; the rest use the 25 bps charge.
const CONVERSION_BPS: Readonly<Partial<Record<Currency, number>>> = {
  USD: 0,
  INR: 30,
  JPY: 30,
  SGD: 30,
};
const DEFAULT_CONVERSION_BPS = 25;

// Currencies the markets trade in, plus EUR, which the top bar offers as a base currency.
const ENABLED: readonly Currency[] = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'SGD'];

export function seedCurrencyConfigs(): readonly CurrencyConfigInput[] {
  return SUPPORTED_CURRENCIES.map((currency) => ({
    currency,
    enabled: ENABLED.includes(currency),
    rateSourceId: 'prov-fx',
    fallbackSourceId: null,
    maxRateAgeMinutes: 60,
    conversionCostBps: CONVERSION_BPS[currency] ?? DEFAULT_CONVERSION_BPS,
  }));
}

type History<T> = readonly { version: number; savedAt: string; reason: string; snapshot: T }[];

export function seedCurrencyHistory(current: CurrencyConfigInput): History<CurrencyConfigInput> {
  const initial = {
    version: 1,
    savedAt: '2024-01-02T00:00:00.000Z',
    reason: 'Initial configuration.',
  };
  // Invented mock history so diff and revert have something to show.
  if (current.currency === 'INR') {
    return [
      {
        version: 2,
        savedAt: '2025-03-15T00:00:00.000Z',
        reason: 'Outward remittances cost more than assumed; conversion raised from 25 to 30 bps.',
        snapshot: current,
      },
      { ...initial, snapshot: { ...current, conversionCostBps: 25 } },
    ];
  }
  return [{ ...initial, snapshot: current }];
}

export function seedBaseCurrency(): History<BaseCurrencyConfigInput> {
  return [
    {
      version: 1,
      savedAt: '2024-01-02T00:00:00.000Z',
      reason: 'Initial configuration: holdings are funded in USD.',
      snapshot: { currency: 'USD' },
    },
  ];
}

const RANK: Readonly<Record<ConfigHealthDto['status'], number>> = {
  critical: 2,
  warning: 1,
  healthy: 0,
};

export function currencyConfigHealth(
  config: CurrencyConfigInput,
  providers: readonly ProviderConfigInput[],
  baseCurrency: string,
  scenario: string,
): ConfigHealthDto {
  const findings: ConfigHealthDto[] = [];
  const held = heldSymbols((instrument) => instrument.currency === config.currency);
  const isBase = config.currency === baseCurrency;

  if (!config.enabled) {
    if (isBase) {
      findings.push({ status: 'critical', summary: 'Disabled, but it is the base currency.' });
    }
    if (held.length > 0) {
      findings.push({
        status: 'warning',
        summary: `Disabled while ${held.join(', ')} ${held.length === 1 ? 'is' : 'are'} priced in it.`,
      });
    }
  } else if (!isBase) {
    const source = providers.find((item) => item.providerId === config.rateSourceId);
    const fallback = providers.find((item) => item.providerId === config.fallbackSourceId);
    const usable = (provider: ProviderConfigInput | undefined): boolean =>
      provider !== undefined && provider.enabled && provider.coverage.dataKinds.includes('fx');
    if (!usable(source)) {
      findings.push({
        status: usable(fallback) ? 'warning' : 'critical',
        summary: `${config.rateSourceId} is not an enabled FX rate provider${usable(fallback) ? '; rates come from the fallback' : ', so rates will go stale'}.`,
      });
    } else if (source !== undefined) {
      const fault = FAULTS[scenario]?.[source.providerId];
      const age =
        FRESHNESS_DELAYS[scenario]?.[source.providerId] ??
        FRESHNESS.find((item) => item.id === source.providerId)?.ageSeconds;
      if (fault?.status === 'down') {
        findings.push({ status: usable(fallback) ? 'warning' : 'critical', summary: fault.issue });
      } else if (age !== undefined && age > config.maxRateAgeMinutes * 60) {
        findings.push({
          status: 'warning',
          summary: `Newest rate is ${String(Math.round(age / 60))} min old, past the ${String(config.maxRateAgeMinutes)} min limit.`,
        });
      }
    }
  }

  const worst = [...findings].sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  if (worst !== undefined) {
    return findings.length > 1
      ? { status: worst.status, summary: `${worst.summary} (+${String(findings.length - 1)} more)` }
      : worst;
  }
  if (isBase)
    return { status: 'healthy', summary: 'Base currency: every total is reported in it.' };
  if (!config.enabled) return { status: 'healthy', summary: 'Disabled; nothing is priced in it.' };
  return {
    status: 'healthy',
    summary: `Rates from ${config.rateSourceId}; ${String(config.conversionCostBps)} bps to convert into it; ${String(held.length)} held.`,
  };
}
