import type { ReactElement } from 'react';

import { ROUTES } from '../../../../routes/routes';
import { SubNav, type SubNavItem } from '../../../../shell/SubNav';

const BACKTEST_SECTIONS: readonly SubNavItem[] = [
  { to: ROUTES.RESEARCH_BACKTEST_RESULTS, label: 'Saved runs' },
  { to: ROUTES.RESEARCH_BACKTEST_NEW, label: 'New backtest' },
  { to: ROUTES.RESEARCH_BACKTEST_COMPARE, label: 'Compare runs' },
];

export function BacktestNav(): ReactElement {
  return <SubNav ariaLabel="Backtest sections" items={BACKTEST_SECTIONS} />;
}
