export interface StdoutLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface Step {
  name: string;
  status: string;
  duration: number;
  sequence_number: number;
  error_message?: string;
  stack_trace?: string;
}

export interface ScreenshotMeta {
  name: string;
  timestamp: string;
}

export interface TestCasePayload {
  name: string;
  module: string;
  status: string;
  duration: number;
  steps?: Step[];
  stdout: StdoutLog[];
  screenshots?: ScreenshotMeta[];
  error_message?: string;
  error_stack_trace?: string;
}
