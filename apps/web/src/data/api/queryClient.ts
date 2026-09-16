// Shared server-state cache for every screen (UI spec 14, decision 22).

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      // The mock API is served inside the page (decision 21), so there is no network to be offline
      // from. Without this, a browser that reports itself offline parks every failed retry and the
      // screen shows loading skeletons forever instead of its error state.
      networkMode: 'always',
    },
  },
});
