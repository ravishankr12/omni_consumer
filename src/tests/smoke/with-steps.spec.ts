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

    // stdout log
    const stdoutLogs = [
      {
        timestamp: new Date().toISOString(),
        level: testStatus === 'passed' ? 'info' : 'error',
        message: `${testInfo.title} ${testStatus}`,
      },
    ];

    // Clean tags like ['@smoke', '@auth'] => "smoke, auth"
    const tags: string[] = testInfo.tags || [];
    const cleanedTags: string = tags.map((tag) => tag.replace(/^@/, '')).join(', ');

    // Extract steps from attachment
    const stepsAttachment = testInfo.attachments?.find((att) => att.name === 'steps');
    let steps: any[] = [];

    if (stepsAttachment?.body) {
      steps = JSON.parse(stepsAttachment.body.toString());
    }

    const basePayload = {
      name: testInfo.title,
      module: cleanedTags,
      status: testStatus,
      duration: testInfo.duration || 0,
      steps,
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
    console.log(`📤 Sent test case result for "${testInfo.title}":`, response.status);
  });

  // ✅ PASSING TEST: Run 3 times
  for (let i = 1; i <= 3; i++) {
    test(
      `Pass - Login [${i}]`,
      { tag: ['@smoke', '@authentication'] },
      async ({ page }, testInfo) => {
        const steps: any[] = [];

        await test.step('Navigate to login page', async () => {
          await page.goto('https://www.saucedemo.com/v1');
          steps.push({ name: 'Navigate to login page', status: 'passed' });
        });

        await test.step('Enter valid credentials', async () => {
          await page.fill('#user-name', 'standard_user');
          await page.fill('#password', 'secret_sauce');
          steps.push({ name: 'Enter valid credentials', status: 'passed' });
        });

        await test.step('Click login and validate success', async () => {
          await page.click('#login-button');
          await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
          steps.push({ name: 'Validate login success', status: 'passed' });
        });

        // Attach steps for afterEach
        await testInfo.attach('steps', {
          body: Buffer.from(JSON.stringify(steps)),
          contentType: 'application/json',
        });
      }
    );
  }

  // ❌ FAILING TEST: Run 3 times
  for (let i = 1; i <= 3; i++) {
    test(
      `Fail - Login [${i}]`,
      { tag: ['@sanity', '@authentication'] },
      async ({ page }, testInfo) => {
        const steps: any[] = [];

        await test.step('Navigate to login page', async () => {
          await page.goto('https://www.saucedemo.com/v1');
          steps.push({ name: 'Navigate to login page', status: 'passed' });
        });

        await test.step('Enter invalid credentials', async () => {
          await page.fill('#user-name', 'standard_user');
          await page.fill('#password', 'fail');
          steps.push({ name: 'Enter invalid credentials', status: 'passed' });
        });

        await test.step('Click login and expect failure (will fail)', async () => {
          await page.click('#login-button');
          await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html'); // Fails intentionally
          steps.push({ name: 'Validate login fail (wrongly expecting success)', status: 'failed' });
        });

        // Attach steps for afterEach
        await testInfo.attach('steps', {
          body: Buffer.from(JSON.stringify(steps)),
          contentType: 'application/json',
        });
      }
    );
  }
});
