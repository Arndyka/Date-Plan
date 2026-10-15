import { defineConfig, devices } from '@playwright/test';
const externalUrl = process.env.PLAYWRIGHT_BASE_URL;
const channel = process.platform === 'win32' ? 'msedge' : undefined;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 2,
  use: {
    baseURL: externalUrl ?? 'http://127.0.0.1:5173/Date-Plan/',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel },
    },
  ],
  webServer: externalUrl
    ? undefined
    : {
        command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run dev -- --port 5173`,
        url: 'http://127.0.0.1:5173/Date-Plan/',
        reuseExistingServer: true,
      },
});
