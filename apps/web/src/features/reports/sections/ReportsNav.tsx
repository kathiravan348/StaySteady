import type { ReactElement } from 'react';

import { ROUTES } from '../../../routes/routes';
import { SubNav, type SubNavItem } from '../../../shell/SubNav';

const REPORTS_SECTIONS: readonly SubNavItem[] = [
  { to: ROUTES.REPORTS_PERFORMANCE, label: 'Performance & returns' },
  { to: ROUTES.REPORTS_COSTS, label: 'Costs & drag' },
  { to: ROUTES.REPORTS_TAX, label: 'Tax packs' },
];

export function ReportsNav(): ReactElement {
  return <SubNav ariaLabel="Report type sections" items={REPORTS_SECTIONS} />;
}
