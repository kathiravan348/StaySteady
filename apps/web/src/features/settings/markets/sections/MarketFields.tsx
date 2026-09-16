import type { MarketConfigInput } from '../../../../data/schemas';

// Field components (text, number, select, time) are shared by every configuration area and live in
// shared/config; only the section contract is particular to markets.
export interface SectionProps {
  readonly draft: MarketConfigInput;
  readonly isNew: boolean;
  // Every change names the field it touched, so its error can be shown from then on.
  readonly update: (path: string, change: (draft: MarketConfigInput) => MarketConfigInput) => void;
  readonly error: (path: string) => string | undefined;
}
