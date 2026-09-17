import { expect, test } from '@playwright/test';

// Key screens (owner question 12), each captured in the dark and light themes.
const SCREENS = [
  { name: 'overview', path: '/overview' },
  { name: 'holdings', path: '/portfolio/holdings' },
  { name: 'performance', path: '/portfolio/performance' },
  { name: 'orders', path: '/trading/orders' },
  { name: 'approvals', path: '/trading/approvals' },
  { name: 'risk-limits', path: '/risk/limits' },
  { name: 'settings-markets', path: '/settings/markets' },
] as const;

const THEMES = ['dark', 'light'] as const;

// Mock data is generated from the current day (mock context), so the clock is pinned for stable
// baselines. Only Date is fixed; timers still run so mock latency and polling behave normally.
const FIXED_TIME = new Date('2026-09-17T09:30:00Z');

// Time for queries to settle and charts to finish their first render.
const SETTLE_MS = 2_500;

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await page.clock.setFixedTime(FIXED_TIME);
        await page.addInitScript((selected) => {
          window.localStorage.setItem(
            'staysteady.display',
            JSON.stringify({ theme: selected, density: 'comfortable', gainLoss: 'green-up' }),
          );
          window.localStorage.setItem('staysteady:developer-scenario', 'healthy');
        }, theme);
        await page.goto(screen.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.waitForTimeout(SETTLE_MS);
        await expect(page).toHaveScreenshot(`${screen.name}-${theme}.png`, { fullPage: true });
      });
    }
  });
}
