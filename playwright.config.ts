import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: 'http://localhost:5173',
    // Credentials required for httpOnly cookie auth
    extraHTTPHeaders: {},
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Expect the dev server to be running — start it manually before E2E
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
