import type { ReactElement } from 'react';

import { ROUTES } from '../../../routes/routes';
import { SubNav, type SubNavItem } from '../../../shell/SubNav';

const PLANNING_SECTIONS: readonly SubNavItem[] = [
  { to: ROUTES.PLANNING_ALLOCATION, label: 'Allocation targets' },
  { to: ROUTES.PLANNING_GOALS, label: 'Goals & Reserve' },
  { to: ROUTES.PLANNING_SCENARIOS, label: 'Scenarios & Ladder' },
];

export function PlanningNav(): ReactElement {
  return <SubNav ariaLabel="Financial planning sections" items={PLANNING_SECTIONS} />;
}
