import { test, expect } from '@playwright/test';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

let buildId: string;

const HEADERS = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

test.describe('Swag Labs - Dashboard Integration', () => {
  test.beforeAll(async () => {
    const createUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=production`;
    const payload = {
      duration: 0,
      environment: 'production',
      status: 'in_progress',
    };

    const res = await axios.post(createUrl, payload, { headers: HEADERS });
    buildId = res.data.build.build_id;
    console.log('✅ Build started:', buildId);
  });

  test.afterEach(async ({}, testInfo) => {
    const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';

    const resultPayload = {
      build_id: buildId,
      test_cases: [
        {
          name: testInfo.title,
          module: testInfo.parent?.title || 'General',
          status: testStatus,
          duration: testInfo.duration || 0,
          steps: [],
          stdout: [
            {
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `${testInfo.title} ${testStatus}`,
            },
          ],
        },
      ],
    };

    const testCaseUrl = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;
    const resultRes = await axios.post(testCaseUrl, resultPayload, {
      headers: HEADERS,
    });

    console.log(`📤 Sent result for "${testInfo.title}"`, resultRes.status);
  });

  test.afterAll(async () => {
    const completeUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${buildId}`;
    const payload = {
      progress_status: 'completed',
      status: 'passed',
      duration: 800,
      environment: 'production',
    };

    const res = await axios.patch(completeUrl, payload, {
      headers: HEADERS,
    });

    console.log('🏁 Build completed:', res.data);
  });

  // --- Your actual Playwright test below ---
  test('Login to Swag Labs', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
});
