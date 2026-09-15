// Shared money representation and arithmetic barrel export (standards 6.4 and decision 7).

export type { Money } from './money';
export { createMoney, isMoney, zeroMoney } from './money';

export {
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  sumMoney,
  allocateMoney,
} from './arithmetic';

export type { GainLoss } from './conversion';
export {
  convertCurrency,
  compareMoney,
  equalsMoney,
  isMoneyPositive,
  isMoneyNegative,
  isMoneyZero,
  calculateGainLoss,
} from './conversion';

export type { FxQuote } from './fxTable';
export { convertMoneyWithTable, findFxRate } from './fxTable';
