import { defineConfig, devices } from '@playwright/test';

// Visual regression (L-12; owner question 12): screenshot baselines kept in the repository and run
// locally only — there is no CI (decision 11). Uses the Vite dev server with the MSW mock API.
export default defineConfig({
  testDir: '.',
  snapshotPathTemplate: '{testDir}/baselines/{arg}-{platform}{ext}',
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'report' }]],
  outputDir: 'results',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
      stylePath: './screenshot.css',
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'en-GB',
    timezoneId: 'Asia/Kolkata',
  },
  webServer: {
    command: 'pnpm dev',
    cwd: '..',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
