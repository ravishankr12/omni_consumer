import { test, expect } from '@playwright/test';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'; // Import AWS SDK v3
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating test IDs

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;
const AWS_REGION = process.env.AWS_REGION!;
const SERVICE_NAME = process.env.SERVICE_NAME!;
const AWS_ACCESS_KEY = process.env.ACCESS_KEY!; //  Load from .env
const AWS_SECRET_KEY = process.env.SECRET_KEY!; // Load from .env
const AWS_S3_BUCKET = 'omni-test-dashboard';

let buildId: string;

const HEADERS = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: { // Use credentials from environment variables
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

/**
 * Uploads a screenshot to S3 with a hardcoded name "screenshot-10.png".
 * @param page The Playwright Page object.
 * @returns The URL of the uploaded screenshot, or 'upload_failed' on error.
 */
async function uploadScreenshotToS3(page: Page, s3Key:string): Promise<string> {
    const screenshotName = 'screenshot-10.png';
    const screenshotPath = path.join(__dirname, screenshotName); // Ensure correct path
    const uploadUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

  try {
    // Take the screenshot
    await page.screenshot({ path: screenshotPath });
    const fileContent = fs.readFileSync(screenshotPath);

    const uploadParams = {
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'image/png',
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    const uploadResult = await s3Client.send(uploadCommand);

    console.log(`Screenshot uploaded to S3: ${uploadResult.ETag}, URL: ${uploadUrl}`);
    return uploadUrl;
  } catch (error: any) {
    console.error('Error uploading screenshot:', error);
    return 'upload_failed';
  }
}

test.describe('Swag Labs - Dashboard Integration', () => {
  test.beforeAll(async () => {
    const createUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=production`;
    const payload = {
      duration: 0,
      environment: 'production',
      status: 'in_progress',
    };

    console.log(`Calling API to create build: ${createUrl}`, payload);
    const res = await axios.post(createUrl, payload, { headers: HEADERS });
    buildId = res.data.build.build_id;
    console.log('Build started:', buildId);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';
    let cloudUrl: string | undefined;
    const testId = uuidv4(); // Generate a unique test ID for each test case
    const screenshotName = 'screenshot-10.png';
    const s3Key = `${SERVICE_NAME}/${PROJECT_ID}/builds/${buildId}/tests/${testId}/${screenshotName}`;
    console.log(`Test case: ${testInfo.title} finished with status: ${testStatus}, Test ID: ${testId}`);

    if (testStatus === 'failed') {
      cloudUrl = await uploadScreenshotToS3(page, s3Key); // Upload screenshot to S3
      if (cloudUrl === 'upload_failed') {
        console.error('Screenshot upload failed.  Test results may not include the screenshot.');
        cloudUrl = undefined; // Ensure cloudUrl is undefined for the payload
      }
    }

    const resultPayload = {
      build_id: buildId,
      test_cases: [
        {
          name: testInfo.title,
          module: 'General',
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
          // Include the screenshot URL and testId in the payload
          ...(testStatus === 'failed' && cloudUrl ? {
            attachments: [
              {
                name: screenshotName,
                path: cloudUrl,
                content_type: 'image/png',
              },
            ],
          } : {}),
          test_id: testId,
        },
      ],
    };

    const testCaseUrl = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;
    console.log(`Sending test case results to: ${testCaseUrl}`, resultPayload);
    const resultRes = await axios.post(testCaseUrl, resultPayload, {
      headers: HEADERS,
    });

    console.log(`Sent test case results: ${resultRes.status}`);
  });

  test.afterAll(async () => {
    const completeUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${buildId}`;
    const payload = {
      progress_status: 'completed',
      status: 'passed',
      duration: 800,
      environment: 'production',
    };

    console.log(`Completing build with URL: ${completeUrl}`, payload);
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

  test('Swag Labs failed test cases', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', '');
    await page.click('#login-button');
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
});
