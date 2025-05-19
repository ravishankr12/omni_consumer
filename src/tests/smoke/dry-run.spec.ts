import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import { TestCaseService } from '../../lib/test-case-api';
import path from 'path';
import axios from 'axios';

let buildID: string;

// Load buildId from file before tests
test.beforeAll(async () => {
  const data = await fs.readFile('build-meta.json', 'utf-8');
  buildID = JSON.parse(data).buildId;
});

test.describe('Swag Labs - Dashboard Integration', () => {
  test.afterEach(async ({}, testInfo) => {
    const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';

    const screenshotsMeta = [];
    const screenshotNames = ['error-step1.png', 'error-step2.png'];
    for (const name of screenshotNames) {
      screenshotsMeta.push({
        name,
        timestamp: new Date().toISOString(),
      });
    }

    const stdoutLogs = [
      {
        timestamp: new Date().toISOString(),
        level: testStatus === 'passed' ? 'INFO' : 'ERROR',
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
      screenshots: screenshotsMeta.length > 0 ? screenshotsMeta : [],
    };

    let payload;
    if (testStatus === 'passed') {
      payload = TestCaseService.createPassedTestCasePayload(
        basePayload.name,
        basePayload.module,
        basePayload.status,
        basePayload.duration,
        basePayload.steps,
        basePayload.stdout,
        basePayload.screenshots
      );
    } else {
      payload = TestCaseService.createFailedTestCasePayload(
        basePayload.name,
        basePayload.module,
        basePayload.status,
        basePayload.duration,
        basePayload.steps,
        basePayload.stdout,
        basePayload.screenshots,
        testInfo.error?.message || 'Unknown error',
        testInfo.error?.stack || ''
      );
    }

    const response = await TestCaseService.createTestCase(buildID, payload);
    console.log(`Sent test case result for "${testInfo.title}":`, response);
    console.log(response[0].id);
    console.log(response[0].screenshots);

    // Folder where your screenshots are saved (relative to this spec file)
    const snapshotsFolder = path.resolve(__dirname, 'dry-run.spec.ts-snapshots');

    for (const screenshot of response[0].screenshots) {
      const screenshotName = screenshot.name;
      const imagePath = path.join(snapshotsFolder, screenshotName);
      const fileData = await fs.readFile(imagePath);

      await axios.put(screenshot.uploadUrl, fileData, {
        headers: {
          'Content-Type': 'image/png',
        },
        maxBodyLength: Infinity,
      });
    }

    // Push uploaded S3 screenshot paths to the dashboard
    const screenshotsPayload = response[0].screenshots.map(
      (screenshot: { name: string; path?: string; s3Path: string; timestamp: string }) => ({
        name: screenshot.name,
        path: screenshot.s3Path,
        timestamp: screenshot.timestamp,
      })
    );

    await axios.patch(
      `https://omni-dashboard-inky.vercel.app/api/v1/projects/b3d59af9-c810-4f48-8e1e-edf25e5ad26f/test-cases/${response[0].id}/screenshots`,
      { screenshots: screenshotsPayload },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'omni_live_ecc1acg7FV0JR4HsBftqyakKUJjwDbzvh1cm-_7aBMQ',
        },
      }
    );
  });

  // Passing test
  for (let i = 1; i <= 1; i++) {
    test(`Pass - Login [${i}]`, { tag: ['@smoke', '@authtication'] }, async ({ page }) => {
      await page.goto('https://www.saucedemo.com/v1');
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await expect(page).toHaveScreenshot({ fullPage: true });
      await page.click('#login-button');
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    });
  }

  // Run failing login test n times
  for (let i = 1; i <= 1; i++) {
    test(`Fail - Login [${i}]`, { tag: ['@sanity', '@authtication'] }, async ({ page }) => {
      await page.goto('https://www.saucedemo.com/v1');
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'fail');
      await page.click('#login-button');
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html'); // will fail
    });
  }
});
