import { useCallback, useEffect, useState } from 'react';

import {
  loadDisplaySettings,
  readSystemPreferences,
  saveDisplaySettings,
  subscribeToSystemPreferences,
} from './displayEnvironment';
import { applyDisplaySettings, resolveTheme } from './displaySettings';
import type { DisplaySettings, SystemPreferences, Theme } from './displaySettings';

export interface DisplaySettingsState {
  readonly settings: DisplaySettings;
  readonly resolvedTheme: Theme;
  readonly update: (changes: Partial<DisplaySettings>) => void;
}

// Owns display settings for the whole app. Call once, at the app root.
export function useDisplaySettings(): DisplaySettingsState {
  const [settings, setSettings] = useState<DisplaySettings>(loadDisplaySettings);
  const [system, setSystem] = useState<SystemPreferences>(readSystemPreferences);

  useEffect(
    () =>
      subscribeToSystemPreferences(() => {
        setSystem(readSystemPreferences());
      }),
    [],
  );

  useEffect(() => {
    applyDisplaySettings(document.documentElement, settings, system);
    saveDisplaySettings(settings);
  }, [settings, system]);

  const update = useCallback((changes: Partial<DisplaySettings>) => {
    setSettings((current) => ({ ...current, ...changes }));
  }, []);

  return { settings, resolvedTheme: resolveTheme(settings.theme, system), update };
}
