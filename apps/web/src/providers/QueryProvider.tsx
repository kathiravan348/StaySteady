// Server-state cache provider for every screen (UI spec 14, decision 22).

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { queryClient } from '../data/api/queryClient';
import { subscribeToScenarioChange } from '../data/mock/scenarios/scenarioContext';

export function QueryProvider({ children }: { readonly children: ReactNode }): ReactElement {
  // Mock-only: a developer scenario changes what the mock API returns, so refetch everything.
  // Remove with the scenario switcher when a real backend is connected.
  useEffect(
    () =>
      subscribeToScenarioChange(() => {
        void queryClient.invalidateQueries();
      }),
    [],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
