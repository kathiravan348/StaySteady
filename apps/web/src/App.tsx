// Root Application component (standards 8).

import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { SystemStateProvider } from './providers/SystemStateProvider';
import { MarketScheduleProvider } from './providers/MarketScheduleProvider';
import { AppRoutes } from './routes/AppRoutes';

export function App(): ReactElement {
  return (
    <QueryProvider>
      <SystemStateProvider>
        <MarketScheduleProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </MarketScheduleProvider>
      </SystemStateProvider>
    </QueryProvider>
  );
}
