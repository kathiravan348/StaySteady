/**
 * Developer Scenario Context for Mock Infrastructure.
 * Allows mock handlers to simulate specific platform conditions defined in UI Spec Section 15.
 */

export const DEVELOPER_SCENARIOS = [
  'healthy',
  'provider-down',
  'broker-disconnected',
  'stale-data',
  'safety-breach',
  'empty-portfolio',
  'market-closed',
  'loading-error',
] as const;

export type DeveloperScenarioId = (typeof DEVELOPER_SCENARIOS)[number];

const SCENARIO_STORAGE_KEY = 'staysteady:developer-scenario';
const SCENARIO_CHANGE_EVENT = 'staysteady:scenario-change';

/**
 * Reads the currently selected developer scenario from storage.
 */
export function getActiveDeveloperScenario(): DeveloperScenarioId {
  if (typeof window === 'undefined') {
    return 'healthy';
  }

  const stored = window.localStorage.getItem(SCENARIO_STORAGE_KEY);
  if (stored && (DEVELOPER_SCENARIOS as readonly string[]).includes(stored)) {
    return stored as DeveloperScenarioId;
  }

  return 'healthy';
}

/**
 * Sets the active developer scenario and notifies listeners.
 */
export function setActiveDeveloperScenario(scenario: DeveloperScenarioId): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
  window.dispatchEvent(
    new CustomEvent<DeveloperScenarioId>(SCENARIO_CHANGE_EVENT, { detail: scenario }),
  );
}

/**
 * Subscribes to changes in developer scenario.
 */
export function subscribeToScenarioChange(
  callback: (scenario: DeveloperScenarioId) => void,
): () => void {
  if (typeof window === 'undefined') {
    return (): void => {
      /* noop */
    };
  }

  const handler = (event: Event): void => {
    const customEvent = event as CustomEvent<DeveloperScenarioId>;
    callback(customEvent.detail ?? getActiveDeveloperScenario());
  };

  window.addEventListener(SCENARIO_CHANGE_EVENT, handler);
  return (): void => {
    window.removeEventListener(SCENARIO_CHANGE_EVENT, handler);
  };
}
