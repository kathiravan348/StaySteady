// Display settings: three independent axes applied as attributes on <html> (standards 3.3, 3.5).
// Keep option values, defaults and the storage key in sync with the no-flash script in index.html.

export const THEMES = ['dark', 'light', 'high-contrast'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_PREFERENCES = ['dark', 'light', 'high-contrast', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

export const GAIN_LOSS_CONVENTIONS = ['green-up', 'red-up'] as const;
export type GainLossConvention = (typeof GAIN_LOSS_CONVENTIONS)[number];

export interface DisplaySettings {
  readonly theme: ThemePreference;
  readonly density: Density;
  readonly gainLoss: GainLossConvention;
}

export interface SystemPreferences {
  readonly prefersDark: boolean;
  readonly prefersMoreContrast: boolean;
}

// Dark is the default theme (UI spec 2); "system" is an explicit opt-in.
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'dark',
  density: 'comfortable',
  gainLoss: 'green-up',
};

export const DISPLAY_STORAGE_KEY = 'staysteady.display';

// Narrows an unknown value to one of the allowed options without a type assertion.
export function matchOption<T extends string>(
  options: readonly T[],
  value: unknown,
): T | undefined {
  return options.find((option) => option === value);
}

// Parses stored settings. A missing or invalid axis falls back to its default.
export function parseDisplaySettings(raw: unknown): DisplaySettings {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_DISPLAY_SETTINGS;
  }

  return {
    theme:
      matchOption(THEME_PREFERENCES, 'theme' in raw ? raw.theme : undefined) ??
      DEFAULT_DISPLAY_SETTINGS.theme,
    density:
      matchOption(DENSITIES, 'density' in raw ? raw.density : undefined) ??
      DEFAULT_DISPLAY_SETTINGS.density,
    gainLoss:
      matchOption(GAIN_LOSS_CONVENTIONS, 'gainLoss' in raw ? raw.gainLoss : undefined) ??
      DEFAULT_DISPLAY_SETTINGS.gainLoss,
  };
}

// "system" follows the OS: increased contrast wins, then light or dark colour scheme.
export function resolveTheme(preference: ThemePreference, system: SystemPreferences): Theme {
  if (preference !== 'system') {
    return preference;
  }
  if (system.prefersMoreContrast) {
    return 'high-contrast';
  }
  return system.prefersDark ? 'dark' : 'light';
}

// Attribute changes only — no remount and no stylesheet swap (standards 3.5).
export function applyDisplaySettings(
  root: HTMLElement,
  settings: DisplaySettings,
  system: SystemPreferences,
): void {
  root.dataset.theme = resolveTheme(settings.theme, system);
  root.dataset.density = settings.density;
  root.dataset.gainLoss = settings.gainLoss;
}
