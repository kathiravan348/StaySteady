import { Badge } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { describeTaxStatus } from '../model/holdingTax';
import type { TaxStatus } from '../model/holdingTypes';

export interface TaxStatusBadgeProps {
  readonly status: TaxStatus;
}

// "Approaching" is highlighted: a sale soon could change the tax treatment (requirements 18).
export function TaxStatusBadge({ status }: TaxStatusBadgeProps): ReactElement {
  const variant: BadgeVariant =
    status.kind === 'approaching' ? 'warning' : status.kind === 'long-term' ? 'info' : 'neutral';
  return <Badge variant={variant}>{describeTaxStatus(status)}</Badge>;
}
