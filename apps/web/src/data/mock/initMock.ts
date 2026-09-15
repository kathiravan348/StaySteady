import { worker } from './browser';

let mockInitialized = false;

/**
 * Initializes the Mock Service Worker network interception layer.
 * Must be awaited before mounting the React tree in development mode
 * to guarantee that initial data queries are properly intercepted.
 */
export async function initMock(): Promise<void> {
  if (mockInitialized) {
    return;
  }

  // Only enable mock service worker in browser environments during development
  if (typeof window === 'undefined') {
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
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      quiet: false,
    });
    mockInitialized = true;
    // Log clear confirmation for developer visibility
    console.info('[StaySteady Mock] Network request interception active.');
  } catch (error: unknown) {
    console.error('[StaySteady Mock] Failed to initialize Mock Service Worker:', error);
  }
}

/**
 * Checks whether the mock interception layer is active.
 */
export function isMockActive(): boolean {
  return mockInitialized;
}
