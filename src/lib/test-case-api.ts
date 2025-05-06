import axios from 'axios';
import { TestCaseResponse } from './api-clients/types/test-case-service';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  Accept: 'application/json',
};

export const TestCaseService = {
  // Fetch failed test cases within the last 'days'
  async getFailedTestCases(days: number = 7): Promise<TestCaseResponse> {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases?days=${days}&status=failed`;
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching failed test cases:', error);
      throw error;
    }
  },

  // Fetch test cases for a specific build
  async getTestCasesForBuild(buildId: string): Promise<TestCaseResponse> {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/test-cases?build_id=${buildId}`;
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching test cases for build:', error);
      throw error;
    }
  },

  // Create a test case with a given payload
  async createTestCase(buildId: string, testCasePayload: any): Promise<any> {
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

  // Helper method to create test case payloads
  createTestCasePayload(name: string, module: string, status: string, duration: number, steps: any[] = [], stdout: any[] = []): any {
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
