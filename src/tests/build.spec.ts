import { test, expect } from '@playwright/test';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

test.describe('Builds API', () => {
  let createdBuildId: string;

  test('Get Builds for a Project and validate project_id', async () => {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=production`;

    try {
      const res = await axios.get(url, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Response:', res.data);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.builds)).toBe(true);

      for (const build of res.data.builds) {
        expect(build.project_id).toBe(PROJECT_ID);
      }
    } catch (error: any) {
      console.error('Axios error:', error.response?.status, error.response?.data);
      throw error;
    }
  });

  test('Start a new build', async () => {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=production`;

    try {
      const payload = {
        duration: 0,
        environment: 'production',
        status: 'in_progress',
      };

      const res = await axios.post(url, payload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Start Build Response:', res.data);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('build');
      expect(res.data.build).toHaveProperty('build_id');

      createdBuildId = res.data.build.build_id;
    } catch (error: any) {
      console.error('Axios error:', error.response?.status, error.response?.data);
      throw error;
    }
  });

  test('Complete a build', async () => {
    await new Promise((resolve) => setTimeout(resolve, 20000));

    const url = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${createdBuildId}`;

    const payload = {
      progress_status: 'completed',
      status: 'failed',
      duration: 800,
      environment: 'production',
    };

    try {
      const res = await axios.patch(url, payload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Complete Build Response:', res.data);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('build');
      expect(res.data.build.status).toBe('failed');
    } catch (error: any) {
      console.error('Axios error:', error.response?.status, error.response?.data);
      throw error;
    }
  });
  test('Get test cases for a project - failed in last 7 days', async () => {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases?days=7&status=failed`;

    try {
      const response = await axios.get(url, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Response data:', response.data);
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  });

  test('Get test cases for a project and a build', async () => {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases?build_id=${createdBuildId}`;

    const response = await axios.get(url, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    expect(response.status).toBe(200);
    console.log('Test cases for build:', response.data);
  });

  test('Create a new test case - passed', async () => {
    const payload = {
      build_id: createdBuildId,
      test_cases: [
        {
          name: 'Login Test with mobile number',
          module: 'Authentication',
          status: 'passed',
          duration: 5000,
          steps: [],
          stdout: [
            {
              timestamp: '2024-04-25T00:00:00Z',
              level: 'info',
              message: 'Login successful',
            },
          ],
        },
      ],
    };

    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    expect(response.status).toBe(200);
    console.log('Create passed test case:', response.data);
  });

  test('Create a new test case - failed', async () => {
    const payload = {
      build_id: createdBuildId,
      test_cases: [
        {
          name: 'Login Test with email',
          module: 'Authentication',
          status: 'failed',
          duration: 4000,
          steps: [],
          stdout: [
            {
              timestamp: '2024-04-25T10:15:30.123Z',
              level: 'INFO',
              message: 'Starting User Registration Test',
            },
            {
              timestamp: '2024-04-25T10:15:31.234Z',
              level: 'DEBUG',
              message:
                "Form data: { email: 'test@example.com', username: 'testuser', password: '********' }",
            },
            {
              timestamp: '2024-04-25T10:15:32.345Z',
              level: 'INFO',
              message: 'Form validation passed',
            },
            {
              timestamp: '2024-04-25T10:15:33.456Z',
              level: 'DEBUG',
              message: 'POST /api/auth/register - Status: 200',
            },
            {
              timestamp: '2024-04-25T10:15:43.567Z',
              level: 'ERROR',
              message: 'Failed to find success message element',
            },
            {
              timestamp: '2024-04-25T10:15:43.678Z',
              level: 'ERROR',
              message: 'Network response: 504 Gateway Timeout',
            },
          ],
          error_message: 'Registration failed: Server timeout while waiting for response',
          error_stack_trace: `Error: Registration failed: Server timeout while waiting for response\n    at RegistrationTest.execute (/tests/specs/auth/registration.test.ts:92:11)\n    at TestRunner.runTest (/tests/framework/runner.ts:156:23)\n    at async TestSuite.run (/tests/framework/suite.ts:78:45)`,
        },
      ],
    };

    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    expect(response.status).toBe(200);
    console.log('Create passed test case:', response.data);
  });

  test('Create a new test case - passed with steps', async () => {
    const payload = {
      build_id: createdBuildId,
      test_cases: [
        {
          name: 'Login Test with mobile number and otp with steps',
          module: 'Authentication',
          status: 'passed',
          duration: 5000,
          steps: [
            {
              name: 'Fill registration form',
              status: 'passed',
              duration: 3000,
              sequence_number: 1,
            },
            {
              name: 'enter OTP',
              status: 'failed',
              duration: 12000,
              sequence_number: 2,
              error_message: 'Timeout waiting for success message',
              stack_trace:
                'TimeoutError: Element <div.success-message> still not visible after 10000ms\n    at waitForElement (/tests/helpers/wait.ts:45:23)\n    at RegistrationPage.submitForm (/tests/pages/registration.ts:67:12)\n    at UserRegistrationTest.test (/tests/specs/auth/registration.test.ts:89:34)',
            },
          ],
          stdout: [
            {
              timestamp: '2024-04-25T00:00:00Z',
              level: 'info',
              message: 'Login successful',
            },
          ],
        },
      ],
    };

    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    expect(response.status).toBe(200);
    console.log('Create passed test case:', response.data);
  });
});
