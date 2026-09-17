// Reconciliation runs and resolutions for the page load (E-05; decisions 37 and 45). Statements are
// the broker positions with one deliberate difference: the Zerodha CDSL statement shows two fewer
// RELIANCE shares, so a mismatch is always there to see until the owner resolves it.

import type { ReconciliationAccountDto } from '../../schemas/reconciliation';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { generatePortfolioData, getInstrumentById } from '../generators';
import { CANONICAL_BROKERS } from '../generators/brokers';
import { tradingContext } from './tradingStore';

interface AccountSeed {
  readonly depository: string;
  readonly accountReference: string;
  readonly method: string;
  readonly hoursAgo: number;
}

const SEEDS: Readonly<Record<string, AccountSeed>> = {
  'brk-ibkr': {
    depository: 'DTC (via the broker’s clearing firm)',
    accountReference: '•••• 9421',
    method: 'Monthly statement from the clearing firm',
    hoursAgo: 20,
  },
  'brk-zerodha': {
    depository: 'CDSL',
    accountReference: '•••• 0412',
    method: 'Consolidated account statement',
    hoursAgo: 6,
  },
  'brk-hl': {
    depository: 'HL nominee register',
    accountReference: '•••• 7730',
    method: 'Quarterly nominee statement',
    hoursAgo: 30,
  },
  'brk-private-notes': {
    depository: 'Issuer registrar',
    accountReference: '•••• 1188',
    method: 'Registrar confirmation letter',
    hoursAgo: 24 * 40,
  },
};

const STATEMENT_SHORTFALL: Readonly<Record<string, number>> = { RELIANCE: 2 };

const lastRuns = new Map<string, IsoUtcTimestamp>();
const resolutions = new Map<string, { at: IsoUtcTimestamp; reason: string }>();

function lastRunFor(brokerId: string, seed: AccountSeed): IsoUtcTimestamp {
  return (
    lastRuns.get(brokerId) ??
    toIsoUtcTimestamp(new Date(Date.now() - seed.hoursAgo * 3_600_000).toISOString())
  );
}

export function reconciliationAccounts(): ReconciliationAccountDto[] {
  const { holdings } = generatePortfolioData(tradingContext);
  return CANONICAL_BROKERS.flatMap((broker) => {
    const id = String(broker.id);
    const seed = SEEDS[id];
    if (seed === undefined) return [];
    const held = holdings.filter((holding) => holding.brokerId === id);
    const discrepancies = held.flatMap((holding) => {
      const symbol =
        getInstrumentById(String(holding.instrumentId))?.symbol ?? String(holding.instrumentId);
      const shortfall = STATEMENT_SHORTFALL[symbol] ?? 0;
      const quantity = Number(holding.quantity);
      return shortfall === 0
        ? []
        : [
            {
              instrumentSymbol: symbol,
              brokerQuantity: quantity,
              statementQuantity: Math.max(quantity - shortfall, 0),
            },
          ];
    });
    const resolution = resolutions.get(id) ?? null;
    const status =
      held.length === 0 ? 'never_run' : discrepancies.length > 0 ? 'mismatch' : 'matched';
    return [
      {
        brokerId: id,
        brokerName: broker.name,
        depository: seed.depository,
        accountReference: seed.accountReference,
        method: seed.method,
        lastRunAt: held.length === 0 ? null : lastRunFor(id, seed),
        positionsChecked: held.length,
        discrepancies,
        status,
        automationPaused: status === 'mismatch' && resolution === null,
        resolution,
      },
    ];
  });
}

export function runReconciliation(brokerId: string, at: IsoUtcTimestamp): boolean {
  if (SEEDS[brokerId] === undefined) return false;
  lastRuns.set(brokerId, at);
  return true;
}

export function resolveReconciliation(brokerId: string, reason: string, at: IsoUtcTimestamp): void {
  resolutions.set(brokerId, { at, reason });
}

export function isAutomationPausedFor(brokerId: string): boolean {
  return reconciliationAccounts().some(
    (account) => account.brokerId === brokerId && account.automationPaused,
  );
}
