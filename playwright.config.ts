import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5173/Date-Plan/', trace: 'retain-on-failure', headless: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'msedge' } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm.cmd run dev -- --port 5173',
    url: 'http://127.0.0.1:5173/Date-Plan/',
    reuseExistingServer: true,
  },
});
