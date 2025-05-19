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

  createPassedTestCasePayload(
    name: string,
    module: any,
    status: string,
    duration: number,
    steps: Step[] = [],
    stdout: StdoutLog[],
    screenshots: ScreenshotMeta[] = []
  ): TestCasePayload {
    return {
      name,
      module,
      status,
      duration,
      steps,
      stdout,
      screenshots,
    };
  },

  createFailedTestCasePayload(
    name: string,
    module: any,
    status: string,
    duration: number,
    steps: Step[] = [],
    stdout: StdoutLog[],
    screenshots: ScreenshotMeta[] = [],
    error_message: string,
    error_stack_trace: string
  ): TestCasePayload {
    return {
      name,
      module,
      status,
      duration,
      steps,
      stdout,
      screenshots,
      error_message,
      error_stack_trace,
    };
  },

  createTestCaseWithStepsPayload(
    name: string,
    module: string,
    status: string,
    duration: number,
    steps: Step[],
    stdout: StdoutLog[]
  ): TestCasePayload {
    return {
      name,
      module,
      status,
      duration,
      steps,
      stdout,
    };
  },
};
