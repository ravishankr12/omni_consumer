import { test, expect } from '@playwright/test';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

let buildId: string;
let totalDuration = 0;

const HEADERS = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

test.describe('Swag Labs - Dashboard Integration', () => {
  test.beforeAll(async () => {
    try {
      const createUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=production`;
      const payload = {
        duration: 0,
        environment: 'production',
        status: 'in_progress',
      };

      const res = await axios.post(createUrl, payload, { headers: HEADERS });
      buildId = res.data.build.build_id;
      console.log('✅ Build started:', buildId);
    } catch (err) {
      console.error('❌ Error creating build:', err);
    }
  });

  test.afterEach(async ({}, testInfo) => {
    try {
      totalDuration += testInfo.duration || 0;
      const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';

      const stdoutLogs = [
        {
          timestamp: new Date().toISOString(),
          level: testStatus === 'passed' ? 'info' : 'error',
          message: `${testInfo.title} ${testStatus}`,
        },
      ];

      const testCase = {
        name: testInfo.title,
        module: 'General',
        status: testStatus,
        duration: testInfo.duration || 0,
        steps: [],
        stdout: stdoutLogs,
        ...(testStatus === 'failed' && {
          error_message: testInfo.error?.message || 'Unknown error',
          error_stack_trace: testInfo.error?.stack || '',
        }),
      };

      const resultPayload = {
        build_id: buildId,
        test_cases: [testCase],
      };

      const testCaseUrl = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;
      await axios.post(testCaseUrl, resultPayload, { headers: HEADERS });
      console.log(`📤 Sent result for "${testInfo.title}"`);
    } catch (err) {
      console.error(`❌ Error reporting result for "${testInfo.title}":`, err);
    }
  });

  test.afterAll(async () => {
    try {
      const completeUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${buildId}`;
      const payload = {
        progress_status: 'completed',
        status: 'passed',
        duration: totalDuration,
        environment: 'production',
      };

      const res = await axios.patch(completeUrl, payload, { headers: HEADERS });
      console.log('🏁 Build completed:', res.data);
    } catch (err) {
      console.error('❌ Error completing build:', err);
    }
  });

  // Generate 50 passing tests
  for (let i = 1; i <= 5; i++) {
    test(`Pass - Login ${i}`, async ({ page }) => {
      await page.goto('https://www.saucedemo.com/v1');
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    });
  }
  let count = 1;
  test(`Fail - Login ${count}`, async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'wrong_password'); // fix incorrect selector
    await page.click('#login-button');
    await expect.soft(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
  count++;
  test(`Fail - Login ${count}`, async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'wrong_password'); // fix incorrect selector
    await page.click('#login-button');
    await expect.soft(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
  count++;
  test(`Fail - Login ${count}`, async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'wrong_password'); // fix incorrect selector
    await page.click('#login-button');
    await expect.soft(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
  count++;
  test(`Fail - Login ${count}`, async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'wrong_password'); // fix incorrect selector
    await page.click('#login-button');
    await expect.soft(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
  count++;
  test(`Fail - Login ${count}`, async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'wrong_password'); // fix incorrect selector
    await page.click('#login-button');
    await expect.soft(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
});
