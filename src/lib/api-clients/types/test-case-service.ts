// Define the expected response structure for test cases
export interface TestCaseResponse {
    status: string;
    test_cases: Array<{
      id: string;
      name: string;
      module: string;
      status: string;
      duration: number;
      steps: Array<{
        name: string;
        status: string;
        duration: number;
        sequence_number: number;
        error_message?: string;
        stack_trace?: string;
      }>;
      stdout: Array<{
        timestamp: string;
        level: string;
        message: string;
      }>;
    }>;
  }
  