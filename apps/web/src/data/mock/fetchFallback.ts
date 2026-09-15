// Dev-only fallback for when the Mock Service Worker cannot register, for example in embedded browsers
// that block service workers. Same-origin /api/* requests are answered in the page by the same MSW
// handlers, so screens behave identically. Every other request goes to the real fetch untouched.

import { getResponse } from 'msw';

import { handlers } from './handlers';

const API_PREFIX = '/api/';

function requestUrl(input: RequestInfo | URL): URL {
  const raw = input instanceof Request ? input.url : input instanceof URL ? input.href : input;
  return new URL(raw, window.location.href);
}

export function installFetchFallback(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = requestUrl(input);
    // Check the URL first: building a Request from another Request consumes its body.
    if (url.origin === window.location.origin && url.pathname.startsWith(API_PREFIX)) {
      const mocked = await getResponse([...handlers], new Request(input, init));
      if (mocked !== undefined) {
        return mocked;
      }
    }
    return originalFetch(input, init);
  };
}
