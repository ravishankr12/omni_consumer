import { test, expect } from '@playwright/test';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'; // Import AWS SDK v3

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
    console.log('Build started:', buildId);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';
    let screenshotName = '';
    let screenshotPath: string | undefined;
    let cloudUrl: string | undefined; // To store the cloud URL

    if (testStatus === 'failed') {
      //screenshotName = `${testInfo.title.replace(/\s/g, '_')}_failed.png`; // Sanitize title - Original screenshot name
      screenshotName = 'screenshot-6.png'; // Hardcoded screenshot name
      console.log(`Screenshot name: ${screenshotName}`); // Print the screenshot name
      screenshotPath = path.join(testInfo.outputDir, screenshotName);
      await page.screenshot({ path: screenshotPath });

      // Upload the screenshot to S3 using AWS SDK
      try {
        const fileContent = fs.readFileSync(screenshotPath);
        const s3Key = `${SERVICE_NAME}/${PROJECT_ID}/builds/${buildId}/tests/${testInfo.testId}/${screenshotName}`; // Construct S3 key

        const uploadParams = {
          Bucket: AWS_S3_BUCKET,
          Key: s3Key,
          Body: fileContent,
          ContentType: 'image/png', // Set the correct content type
          ACL: 'public-read', // Or your desired ACL
        };

        const uploadCommand = new PutObjectCommand(uploadParams);
        const uploadResult = await s3Client.send(uploadCommand);

        console.log(`Screenshot uploaded to S3: ${uploadResult.ETag}`); // Log the ETag
        cloudUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`; // Construct the public URL
      } catch (error: any) {
        console.error('Error uploading screenshot:', error);
        cloudUrl = 'upload_failed';
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
          // Include the screenshot URL in the payload
          ...(testStatus === 'failed' && {
            attachments: [
              {
                name: screenshotName, // Use the hardcoded screenshot name
                path: cloudUrl, // Use the cloud URL
                content_type: 'image/png',
              },
            ],
          }),
        },
      ],
    };

    const testCaseUrl = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;
    const resultRes = await axios.post(testCaseUrl, resultPayload, {
      headers: HEADERS,
    });

    console.log(`Sent result for "${testInfo.title}"`, resultRes.status);
  });

  test.afterAll(async () => {
    const completeUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${buildId}`;
    const payload = {
      progress_status: 'completed',
      status: 'passed', //  make sure this matches the overall status
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

  test('Swag Labs failed test cases', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1');
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', '');
    await page.click('#login-button');
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });
});
