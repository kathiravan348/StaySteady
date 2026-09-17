// CSV export of the holdings view (UI spec 7.2 bulk export, UI spec 9 export current view). Pure.

import { formatSignedPercent } from '../../../../shared/format';
import type { Money } from '../../../../shared/money';
import { describeTaxStatus } from './holdingTax';
import type { HoldingRow } from './holdingTypes';

export interface HoldingColumnOption {
  readonly id: string;
  readonly label: string;
  // Grouping-only and always-on columns are not offered in the column picker.
  readonly pickable: boolean;
  readonly defaultVisible: boolean;
  readonly exportValue: (row: HoldingRow) => string;
}

// Full precision and an explicit currency, so exported numbers are never ambiguous.
const moneyText = (money: Money): string => `${money.amount.toFixed()} ${money.currency}`;

export const HOLDING_COLUMN_OPTIONS: readonly HoldingColumnOption[] = [
  {
    id: 'instrument',
    label: 'Instrument',
    pickable: false,
    defaultVisible: true,
    exportValue: (row) => `${row.instrument.symbol} - ${row.instrument.name}`,
  },
  {
    id: 'market',
    label: 'Market',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => row.marketName,
  },
  {
    id: 'country',
    label: 'Country',
    pickable: false,
    defaultVisible: false,
    exportValue: (row) => row.country,
  },
  {
    id: 'currency',
    label: 'Currency',
    pickable: false,
    defaultVisible: false,
    exportValue: (row) => row.instrument.currency,
  },
  {
    id: 'type',
    label: 'Type',
    pickable: true,
    defaultVisible: false,
    exportValue: (row) => row.typeLabel,
  },
  {
    id: 'liquidity',
    label: 'Liquidity',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => `${row.liquidity.label} (${row.liquidity.detail})`,
  },
  {
    id: 'broker',
    label: 'Broker',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => row.brokerName,
  },
  {
    id: 'strategy',
    label: 'Strategy',
    pickable: true,
    defaultVisible: false,
    exportValue: (row) => row.strategyName,
  },
  {
    id: 'quantity',
    label: 'Quantity',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => String(row.quantity),
  },
  {
    id: 'averageCost',
    label: 'Average cost',
    pickable: true,
    defaultVisible: false,
    exportValue: (row) => moneyText(row.averageCost),
  },
  {
    id: 'price',
    label: 'Price and change today',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => `${moneyText(row.lastPrice)} (${formatSignedPercent(row.changePercent)})`,
  },
  {
    id: 'valueLocal',
    label: 'Value (local currency)',
    pickable: true,
    defaultVisible: false,
    exportValue: (row) => moneyText(row.valueLocal),
  },
  {
    id: 'valueBase',
    label: 'Value (base currency)',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => moneyText(row.valueBase),
  },
  {
    id: 'gain',
    label: 'Unrealised gain or loss',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => `${moneyText(row.gainBase)} (${formatSignedPercent(row.gainPercent)})`,
  },
  {
    id: 'currencyEffect',
    label: 'Currency effect',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => moneyText(row.currencyEffectBase),
  },
  {
    id: 'weight',
    label: 'Portfolio weight',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => `${row.weightPercent.toFixed(2)}%`,
  },
  {
    id: 'daysHeld',
    label: 'Days held',
    pickable: true,
    defaultVisible: false,
    exportValue: (row) => String(row.daysHeld),
  },
  {
    id: 'tax',
    label: 'Holding-period tax status',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => describeTaxStatus(row.tax),
  },
  {
    id: 'exit',
    label: 'Exit level and distance',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) =>
      row.exit === null
        ? ''
        : `${moneyText(row.exit.level)} (${row.exit.distancePercent.toFixed(2)}% away)`,
  },
  {
    id: 'news',
    label: 'News stories',
    pickable: true,
    defaultVisible: true,
    exportValue: (row) => String(row.newsStories),
  },
];

// Grouping-only columns stay hidden regardless of a saved layout.
export const FORCED_HIDDEN_COLUMNS: Readonly<Record<string, boolean>> = {
  country: false,
  currency: false,
};

export const DEFAULT_COLUMN_VISIBILITY: Readonly<Record<string, boolean>> = Object.fromEntries(
  HOLDING_COLUMN_OPTIONS.map((option) => [option.id, option.defaultVisible]),
);

// Quotes values containing commas, quotes or line breaks so spreadsheets import them intact.
function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function toCsv(
  rows: readonly HoldingRow[],
  columns: readonly HoldingColumnOption[],
): string {
  const header = columns.map((column) => escapeCsv(column.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsv(column.exportValue(row))).join(','),
  );
  return `${[header, ...lines].join('\n')}\n`;
}
