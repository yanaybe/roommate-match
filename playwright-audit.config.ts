import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'full-audit-2026.spec.ts',
  timeout: 60000,
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
