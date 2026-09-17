import type { ReactElement } from 'react';

import { ROUTES } from '../../../routes/routes';
import { SubNav, type SubNavItem } from '../../../shell/SubNav';

const RISK_SECTIONS: readonly SubNavItem[] = [
  { to: ROUTES.RISK_LIMITS, label: 'Limits & Safety controls' },
  { to: ROUTES.RISK_BREACHES, label: 'Breach history' },
];

export function RiskNav(): ReactElement {
  return <SubNav ariaLabel="Risk and safety sections" items={RISK_SECTIONS} />;
}
