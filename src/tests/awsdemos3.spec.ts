//trying the conection code 

import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY = process.env.ACCESS_KEY!;
const AWS_SECRET_KEY = process.env.SECRET_KEY!;
const AWS_S3_BUCKET = 'omni-test-dashboard';

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

/**
 * Uploads a screenshot to S3 with a hardcoded name "screenshot-10.png" and a hardcoded URL.
 * @param page The Playwright Page object.
 * @returns The URL of the uploaded screenshot, or 'upload_failed' on error.
 */
async function uploadScreenshotToS3(page: Page): Promise<string> {
  const screenshotName = 'screenshot-11.png';
  const screenshotPath = `test-results/${screenshotName}`; // Local path
  const hardcodedS3Url = 'https://omni-test-dashboard.s3.eu-north-1.amazonaws.com/projects/b3d59af9-c810-4f48-8e1e-edf25e5ad26f/builds/f5d15fd1-321f-43e3-afd0-44aa513be47a/tests/2e671027-f107-4bf3-9dde-d4f394c242c2/screenshots-10.png';

  try {
    // Take the screenshot
    await page.screenshot({ path: screenshotPath });
    const fileContent = fs.readFileSync(screenshotPath);

    const uploadParams = {
      Bucket: AWS_S3_BUCKET,
      Key: hardcodedS3Url.split('/').slice(3).join('/'), // Extract key from URL
      Body: fileContent,
      ContentType: 'image/png'//,
    
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    const uploadResult = await s3Client.send(uploadCommand);

    console.log(`Screenshot uploaded to S3: ${uploadResult.ETag}, URL: ${hardcodedS3Url}`);
    return hardcodedS3Url;
  } catch (error: any) {
    console.error('Error uploading screenshot:', error);
    return 'upload_failed';
  }
}

test('S3 Upload Test', async ({ page }) => {
  // 1. Navigate to a page (required to take a screenshot)
  await page.goto('https://www.amazon.com');

  // 2. Upload the screenshot to S3
  const cloudUrl = await uploadScreenshotToS3(page);

  // 3. Assert the upload was successful
  if (cloudUrl !== 'upload_failed') {
    console.log(`Screenshot uploaded successfully. URL: ${cloudUrl}`);
    expect(cloudUrl).toContain('.amazonaws.com');
  } else {
    console.error('Screenshot upload failed.');
    throw new Error('Screenshot upload failed.');
  }
});
