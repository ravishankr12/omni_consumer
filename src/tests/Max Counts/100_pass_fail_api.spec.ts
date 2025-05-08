import { test, expect } from '@playwright/test';
import axios from 'axios';
import { BuildService } from '../../../src/lib/build-service';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

let createdBuildId: string;

const HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

test.describe('Bulk API Test - Dashboard Integration', () => {
  test('Start a new build', async () => {
    const build = await BuildService.startBuild();
    createdBuildId = build.build.build_id;

    console.log('Build started:', createdBuildId);
  });

  test('Push 35 passed test cases', async () => {
    for (let i = 1; i <= 400; i++) {
      const payload = {
        build_id: createdBuildId,
        test_cases: [
          {
            name: `Passed Test Case ${i}`,
            module: 'Authentication',
            status: 'passed',
            duration: 1000 + i * 10,
            steps: [],
            stdout: [
              {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Test case ${i} passed successfully.`,
              },
            ],
          },
        ],
      };

      await axios.post(`${BASE_URL}/projects/${PROJECT_ID}/test-cases`, payload, {
        headers: HEADERS,
      });
    }
    console.log('✅ 35 passed test cases submitted');
  });

  test('Push 35 failed test cases', async () => {
    for (let i = 1; i <= 400; i++) {
      const payload = {
        build_id: createdBuildId,
        test_cases: [
          {
            name: `Failed Test Case ${i}`,
            module: 'Authentication',
            status: 'failed',
            duration: 1000 + i * 20,
            steps: [],
            stdout: [
              {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: `Test case ${i} failed during execution.`,
              },
            ],
            error_message: `Failed due to unexpected error in case ${i}`,
            error_stack_trace: `Error: Something went wrong at case ${i}\n    at testRunner.js:45:10`,
          },
        ],
      };

      await axios.post(`${BASE_URL}/projects/${PROJECT_ID}/test-cases`, payload, {
        headers: HEADERS,
      });
    }
    console.log('❌ 35 failed test cases submitted');
  });

  test('Push 30 test cases with steps', async () => {
    for (let i = 1; i <= 376; i++) {
      const payload = {
        build_id: createdBuildId,
        test_cases: [
          {
            name: `Passed Test Case With Steps ${i}`,
            module: 'Authentication',
            status: 'passed',
            duration: 3000,
            steps: [
              {
                name: 'Step 1 - Fill Form',
                status: 'passed',
                duration: 1000,
                sequence_number: 1,
              },
              {
                name: 'Step 2 - Submit Form',
                status: i % 2 === 0 ? 'passed' : 'failed',
                duration: 2000,
                sequence_number: 2,
                ...(i % 2 !== 0 && {
                  error_message: 'Timeout error on step 2',
                  stack_trace: `Error: Timeout at test case ${i}\n    at formSubmit.js:78:12`,
                }),
              },
            ],
            stdout: [
              {
                timestamp: new Date().toISOString(),
                level: i % 2 === 0 ? 'info' : 'error',
                message: `Test case ${i} executed with ${i % 2 === 0 ? 'no' : 'some'} errors.`,
              },
            ],
          },
        ],
      };

      await axios.post(`${BASE_URL}/projects/${PROJECT_ID}/test-cases`, payload, {
        headers: HEADERS,
      });
    }
    console.log('🔁 30 test cases with steps submitted');
  });

  test('Complete the build', async () => {
    const complete = await BuildService.completeBuild(createdBuildId, 'passed', 9999, 'production');

    console.log('Build completed successfully:', complete);
  });
});
