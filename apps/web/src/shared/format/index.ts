// Formatting utilities barrel export (UI spec 4 and standards 6.4).

export type { FormatNumberOptions, InstrumentType } from './formatNumber';
export {
  formatNumber,
  formatPercentage,
  formatRatio,
  formatInstrumentPrice,
  getDecimalsForInstrument,
} from './formatNumber';

export type { FormatMoneyOptions } from './formatMoney';
export { formatMoney, formatGainLossCombined, getLocaleForCurrency } from './formatMoney';

export type { NumberDirection } from './display';
export {
  directionOfNumber,
  formatSignedMoney,
  formatSignedPercent,
  humanizeToken,
  instrumentTypeInSentence,
  instrumentTypeLabel,
  pluralize,
} from './display';

export type { FormatDateTimeOptions } from './formatDateTime';
export { formatRelativeTime, formatDateTime, formatIsoDate } from './formatDateTime';
