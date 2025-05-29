import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import {
  StdoutLog,
  Step,
  TestCasePayload,
  ScreenshotMeta,
} from './api-clients/types/test-case-service';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  Accept: 'application/json',
};

interface CreateTestCaseOptions {
  testInfo: {
    title: string;
    duration?: number;
    status: 'passed' | 'failed' | 'skipped';
    tags?: string[];
    error?: {
      message?: string;
      stack?: string;
    };
  };
  steps?: Step[];
  stdout?: StdoutLog[];
  screenshots?: ScreenshotMeta[];
}

export const TestCaseService = {
  async createTestCase(buildId: string, testCasePayload: TestCasePayload): Promise<any> {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;
    const payload = {
      build_id: buildId,
      test_cases: [testCasePayload],
    };

    try {
      const response = await axios.post(url, payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating test case:', error);
      throw error;
    }
  },

  async uploadScreenshotsAndUpdateDashboard(testCaseResponse: any, snapshotFolderPath: string) {
    for (const screenshot of testCaseResponse.screenshots) {
      const imagePath = path.join(snapshotFolderPath, screenshot.name);
      const fileData = await fs.readFile(imagePath);

      await axios.put(screenshot.uploadUrl, fileData, {
        headers: {
          'Content-Type': 'image/png',
        },
        maxBodyLength: Infinity,
      });
    }

    const screenshotsPayload = testCaseResponse.screenshots.map(
      (screenshot: { name: string; s3Path: string; timestamp: string }) => ({
        name: screenshot.name,
        path: screenshot.s3Path,
        timestamp: screenshot.timestamp,
      })
    );

    await axios.patch(
      `${BASE_URL}/projects/${PROJECT_ID}/test-cases/${testCaseResponse.id}/screenshots`,
      { screenshots: screenshotsPayload },
      { headers }
    );
  },

  createTestCasePayload({
    testInfo,
    steps = [],
    stdout = [],
    screenshots = [],
  }: CreateTestCaseOptions): TestCasePayload {
    const testStatus = testInfo.status === 'passed' ? 'passed' : 'failed';

    const tags: string[] = testInfo.tags || [];
    const cleanedTags: string = tags.map((tag) => tag.replace(/^@/, '')).join(', ');

    const generatedLog: StdoutLog = {
      timestamp: new Date().toISOString(),
      level: testStatus === 'passed' ? 'INFO' : 'ERROR',
      message: `${testInfo.title} ${testStatus}`,
    };

    return {
      name: testInfo.title,
      module: cleanedTags,
      status: testStatus,
      duration: testInfo.duration || 0,
      steps,
      stdout: [generatedLog, ...stdout],
      screenshots,
      ...(testStatus === 'failed' && {
        error_message: testInfo.error?.message || '',
        error_stack_trace: testInfo.error?.stack || '',
      }),
    };
  },
};
