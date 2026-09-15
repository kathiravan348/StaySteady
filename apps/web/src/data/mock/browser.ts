import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Browser Mock Service Worker instance.
 */
export const worker = setupWorker(...handlers);
