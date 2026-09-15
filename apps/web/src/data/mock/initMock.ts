import { worker } from './browser';
import { installFetchFallback } from './fetchFallback';
import { createMockGeneratorContext } from './generators/mockContext';
import { liveTicker } from './generators/ticker';

export type MockTransport = 'none' | 'service-worker' | 'fetch-fallback';

let mockInitialized = false;
let mockTransport: MockTransport = 'none';

/**
 * Starts the mock API before the React tree mounts, so initial data requests are intercepted.
 * Uses the Mock Service Worker; in development, if the worker cannot register, the same handlers
 * answer /api/* requests in the page instead.
 */
export async function initMock(): Promise<void> {
  if (mockInitialized || typeof window === 'undefined') {
    return;
  }

  const isDev = import.meta.env.DEV;
  const isMockExplicitlyEnabled = import.meta.env.VITE_ENABLE_MOCK === 'true';
  if (!isDev && !isMockExplicitlyEnabled) {
    return;
  }

  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
      quiet: false,
    });
    mockTransport = 'service-worker';
  } catch (error: unknown) {
    if (!isDev) {
      console.error('[StaySteady Mock] Failed to initialize Mock Service Worker:', error);
      return;
    }
    installFetchFallback();
    mockTransport = 'fetch-fallback';
    console.warn(
      '[StaySteady Mock] Service worker unavailable; answering /api/* in the page instead.',
      error,
    );
  }

  mockInitialized = true;

  // Start background live ticking engine (M-15)
  liveTicker.start(createMockGeneratorContext().random.fork('live-ticker'), 2500);
  console.info(`[StaySteady Mock] Mock API active via ${mockTransport}; live ticking started.`);
}

/**
 * Checks whether the mock interception layer is active.
 */
export function isMockActive(): boolean {
  return mockInitialized;
}

/**
 * Which mechanism is answering mock requests (for diagnostics).
 */
export function getMockTransport(): MockTransport {
  return mockTransport;
}
