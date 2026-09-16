// Shared server-state cache for every screen (UI spec 14, decision 22).

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // The mock API is in-page and deterministic, so a retry only repeats the same failure. It
      // also hides errors: a parked retry leaves the screen on loading skeletons instead of showing
      // what went wrong. Revisit when a real backend makes a retry meaningful.
      retry: 0,
      refetchOnWindowFocus: false,
      // The mock API is served inside the page (decision 21), so there is no network to be offline
      // from. Without this, a browser that reports itself offline parks every failed retry and the
      // screen shows loading skeletons forever instead of its error state.
      networkMode: 'always',
    },
  },
});
