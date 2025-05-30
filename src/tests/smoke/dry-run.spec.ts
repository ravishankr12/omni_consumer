import { test, expect } from '@playwright/test';
import path from 'path';
import { configureOmniTest, setupOmniAfterEach } from 'omni-test-intelligence';

configureOmniTest({
  projectId: process.env.PROJECT_ID!,
  apiKey: process.env.API_KEY!,
});
console.log(process.env.BUILD_ID);

setupOmniAfterEach({
  buildId: process.env.BUILD_ID!,
  snapshotPath: path.resolve(__dirname, 'dry-run.spec.ts-snapshots'),
  screenshotNames: ['error-step1.png', 'error-step2.png'],
  stdoutLogs: [],
  steps: [],
});
test.afterEach(async ({}, testInfo) => {
  console.log(`Second afterEach hook: ${testInfo.title}`);
});
// Main suite
test.describe('Swag Labs - Dashboard Integration', () => {
  // Passing Test
  test(
    'Pass - Login [1]',
    {
      tag: ['@smoke', '@authentication', '@P1'],
      annotation: [
        {
          type: 'issue',
          description: 'https://github.com/microsoft/playwright/issues/23180',
        },
      ],
    },
    async ({ page }) => {
      await page.goto('https://www.saucedemo.com/v1');
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await expect(page).toHaveScreenshot({ fullPage: true });
      await page.click('#login-button');
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    }
  );
});
