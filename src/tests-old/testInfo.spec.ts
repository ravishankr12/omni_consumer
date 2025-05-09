import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Fail - Login', async ({ page }) => {
  await test.step('Navigate to login page', async () => {
    await page.goto('https://www.saucedemo.com/v1');
  });

  await test.step('Enter username and password', async () => {
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'fail');
  });

  await test.step('Click login button', async () => {
    await page.click('#login-button');
  });

  await test.step('Verify successful login', async () => {
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
});

test.afterEach(async ({ page }, testInfo) => {
  console.log('--- testInfo Snapshot ---');

  // Attach a screenshot (testInfo.attach with body)
  const screenshot = await page.screenshot();
  await testInfo.attach('screenshot', {
    body: screenshot,
    contentType: 'image/png',
  });

  // Attach a file from disk (you can use a dummy file path for demo)
  const tempFile = testInfo.outputPath('log.txt');
  await fs.promises.writeFile(tempFile, 'Some log content for the test');
  await testInfo.attach('logfile', {
    path: tempFile,
    contentType: 'text/plain',
  });

  // Demonstrating other testInfo properties
  console.log('Title:', testInfo.title);
  console.log('Status:', testInfo.status);
  console.log('Expected Status:', testInfo.expectedStatus);
  console.log('Duration:', testInfo.duration);
  console.log('Errors:', testInfo.errors);
  console.log('Error (First):', testInfo.error);
  console.log('Annotations:', testInfo.annotations);
  console.log('Attachments:', testInfo.attachments);
  console.log('Tags:', testInfo.tags);
  console.log('Retry count:', testInfo.retry);
  console.log('Parallel Index:', testInfo.parallelIndex);
  console.log('Repeat Each Index:', testInfo.repeatEachIndex);
  console.log('Test File:', testInfo.file);
  console.log('Line:', testInfo.line);
  console.log('Column:', testInfo.column);
  console.log('Output Dir:', testInfo.outputDir);
  console.log('Project Name:', testInfo.project.name);
  console.log('Test ID:', testInfo.testId);
  console.log('Snapshot Dir:', testInfo.snapshotDir);
  console.log('Snapshot Suffix:', testInfo.snapshotSuffix);
  console.log('Config Timeout:', testInfo.timeout);

  // Demonstrating outputPath() and snapshotPath()
  console.log('Generated outputPath:', testInfo.outputPath('example.txt'));
  console.log('Generated snapshotPath:', testInfo.snapshotPath('snap.png'));
});
