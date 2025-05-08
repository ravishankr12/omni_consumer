import { test } from '@playwright/test';
import { BuildService } from '../../lib/build-service';
import { TestCaseService } from '../../lib/test-case-api';

let buildID: string;

test.beforeAll(async () => {
  const build = await BuildService.startBuild();
  console.log('Build Started:', build);
  buildID = build.build_id;
});

test.afterAll(async () => {
  const complete = await BuildService.completeBuild(buildID, 'passed', 800, 'production');
  console.log('Build Completed:', complete);
});

test('Create a passed test case', async () => {
  const stdout = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Test case passed successfully',
    },
  ];

  const payload = TestCaseService.createPassedTestCasePayload(
    'Login test',
    'Authentication',
    'passed',
    120,
    [],
    stdout
  );

  const response = await TestCaseService.createTestCase(buildID, payload);
  console.log('Passed Test Case Created:', response);
});

test('Create a failed test case', async () => {
  const stdout = [
    {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Assertion error in checkout flow',
    },
  ];

  const payload = TestCaseService.createFailedTestCasePayload(
    'Checkout test',
    'E-Commerce',
    'failed',
    300,
    [],
    stdout,
    'Expected total price to match',
    'Error: AssertionError\n    at Object.<anonymous> (/tests/checkout.spec.ts:42:13)'
  );

  const response = await TestCaseService.createTestCase(buildID, payload);
  console.log('Failed Test Case Created:', response);
});

test('Create a test case with steps', async () => {
  const stdout = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Stepwise test case logging',
    },
  ];

  const steps = [
    {
      name: 'Open Homepage',
      status: 'passed',
      duration: 100,
      sequence_number: 1,
    },
    {
      name: 'Login User',
      status: 'passed',
      duration: 150,
      sequence_number: 2,
    },
    {
      name: 'Add to Cart',
      status: 'failed',
      duration: 200,
      sequence_number: 3,
      error_message: 'Item not added to cart',
      stack_trace: 'Error: Element not found\n at page.click(...)',
    },
  ];

  const payload = TestCaseService.createTestCaseWithStepsPayload(
    'End-to-End test',
    'E-Commerce',
    'failed',
    450,
    steps,
    stdout
  );

  const response = await TestCaseService.createTestCase(buildID, payload);
  console.log('Test Case with Steps Created:', response);
});
