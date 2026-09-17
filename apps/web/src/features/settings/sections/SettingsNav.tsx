import type { ReactElement } from 'react';

import { ROUTES } from '../../../routes/routes';
import { SubNav, type SubNavItem } from '../../../shell/SubNav';

const SETTINGS_SECTIONS: readonly SubNavItem[] = [
  { to: ROUTES.SETTINGS_MARKETS, label: 'Countries & markets' },
  { to: ROUTES.SETTINGS_PROVIDERS, label: 'Data providers' },
  { to: ROUTES.SETTINGS_BROKERS, label: 'Brokers' },
  { to: ROUTES.SETTINGS_INSTRUMENTS, label: 'Instrument types' },
  { to: ROUTES.SETTINGS_CURRENCIES, label: 'Currencies' },
  { to: ROUTES.SETTINGS_ASSUMPTIONS, label: 'Assumptions & budget' },
  { to: ROUTES.SETTINGS_ALERTS, label: 'Alert rules' },
  { to: ROUTES.SETTINGS_CREDENTIALS, label: 'Credentials' },
  { to: ROUTES.SETTINGS_AUTOMATION, label: 'What can trade' },
  { to: ROUTES.SETTINGS_DISPLAY, label: 'Display preferences' },
];

export function SettingsNav(): ReactElement {
  return <SubNav ariaLabel="Settings and configuration sections" items={SETTINGS_SECTIONS} />;
}
