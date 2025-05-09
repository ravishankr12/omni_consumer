import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  testDir: './src/tests/smoke',
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'html',
  timeout: 600000,

  use: {
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 20000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
