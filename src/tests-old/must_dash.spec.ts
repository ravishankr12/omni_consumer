import { test, expect } from '@playwright/test';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

test.describe('Builds API', () => {
  let createdBuildId: string;

 

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

});
