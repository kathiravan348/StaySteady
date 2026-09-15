import type { HttpHandler } from 'msw';
import { systemHandlers } from './systemHandlers';

/**
 * Combined MSW Request Handlers.
 * Expandable as subsequent domain generators and schemas are completed (M-02..M-13).
 */
export const handlers: readonly HttpHandler[] = [...systemHandlers];
