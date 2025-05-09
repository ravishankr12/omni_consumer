import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import { TestCaseService } from '../../lib/test-case-api';

let buildID: string;

// Load buildId from file before tests
test.beforeAll(async () => {
  const data = await fs.readFile('build-meta.json', 'utf-8');
  buildID = JSON.parse(data).buildId;
});

test.describe('Swag Labs - Dashboard Integration', () => {
  test.afterEach(async ({}, testInfo) => {
    const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';

    const stdoutLogs = [
      {
        timestamp: new Date().toISOString(),
        level: testStatus === 'passed' ? 'info' : 'error',
        message: `${testInfo.title} ${testStatus}`,
      },
    ];
    const tags: string[] = testInfo.tags || [];
    const cleanedTags: string = tags.map((tag) => tag.replace(/^@/, '')).join(', ');

    const basePayload = {
      name: testInfo.title,
      module: cleanedTags,
      status: testStatus,
      duration: testInfo.duration || 0,
      steps: [],
      stdout: stdoutLogs,
    };

    let payload;
    if (testStatus === 'passed') {
      payload = TestCaseService.createPassedTestCasePayload(
        basePayload.name,
        basePayload.module,
        basePayload.status,
        basePayload.duration,
        basePayload.steps,
        basePayload.stdout
      );
    } else {
      payload = TestCaseService.createFailedTestCasePayload(
        basePayload.name,
        basePayload.module,
        basePayload.status,
        basePayload.duration,
        basePayload.steps,
        basePayload.stdout,
        testInfo.error?.message || 'Unknown error',
        testInfo.error?.stack || ''
      );
    }

    const response = await TestCaseService.createTestCase(buildID, payload);
    console.log(`Sent test case result for "${testInfo.title}":`, response);
  });

  // ✅ Passing test
  for (let i = 1; i <= 3; i++) {
    test(`Pass - Login [${i}]`, { tag: ['@smoke', '@authtication'] }, async ({ page }) => {
      await page.goto('https://www.saucedemo.com/v1');
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    });
  }

  // Run failing login test 10 times
  for (let i = 1; i <= 3; i++) {
    test(`Fail - Login [${i}]`, { tag: ['@sanity', '@authtication'] }, async ({ page }) => {
      await page.goto('https://www.saucedemo.com/v1');
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'fail');
      await page.click('#login-button');
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html'); // will fail
    });
  }
});
