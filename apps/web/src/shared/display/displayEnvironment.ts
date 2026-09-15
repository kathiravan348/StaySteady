import {
  DEFAULT_DISPLAY_SETTINGS,
  DISPLAY_STORAGE_KEY,
  parseDisplaySettings,
} from './displaySettings';
import type { DisplaySettings, SystemPreferences } from './displaySettings';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const MORE_CONTRAST_QUERY = '(prefers-contrast: more)';

// Storage can throw when blocked or in private browsing; the defaults apply instead.
export function loadDisplaySettings(): DisplaySettings {
  try {
    const stored = window.localStorage.getItem(DISPLAY_STORAGE_KEY);
    const parsed: unknown = stored === null ? null : JSON.parse(stored);
    return parseDisplaySettings(parsed);
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

export function saveDisplaySettings(settings: DisplaySettings): void {
  try {
    window.localStorage.setItem(DISPLAY_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: the choice still applies until the page is reloaded.
  }
}

export function readSystemPreferences(): SystemPreferences {
  return {
    prefersDark: window.matchMedia(DARK_QUERY).matches,
    prefersMoreContrast: window.matchMedia(MORE_CONTRAST_QUERY).matches,
  };
}

// Calls onChange when the OS colour scheme or contrast preference changes. Returns unsubscribe.
export function subscribeToSystemPreferences(onChange: () => void): () => void {
  const queries = [DARK_QUERY, MORE_CONTRAST_QUERY].map((query) => window.matchMedia(query));
  queries.forEach((query) => {
    query.addEventListener('change', onChange);
  });
  return () => {
    queries.forEach((query) => {
      query.removeEventListener('change', onChange);
    });
  };
}
