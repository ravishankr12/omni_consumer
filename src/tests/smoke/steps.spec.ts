// Required dependencies:
// npm install node-fetch@2 fs path

const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');

/**
 * Helper to determine the correct Content-Type header based on file extension.
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

/**
 * Step 1: Create test cases and get upload URLs for screenshots.
 */
async function createTestCasesWithScreenshots(apiBaseUrl, apiKey, projectId, buildId, testCases) {
  // Prepare the request body: only screenshot metadata, not file data
  const requestBody = {
    build_id: buildId,
    test_cases: testCases.map(tc => ({
      name: tc.name,
      module: tc.module,
      status: tc.status,
      duration: tc.duration,
      error_message: tc.error_message,
      error_stack_trace: tc.error_stack_trace,
      stdout: tc.stdout,
      screenshots: tc.screenshots.map(s => ({
        name: s.name,
        timestamp: s.timestamp
      })),
      steps: tc.steps
    }))
  };

  // Send the request to create test cases
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/test-cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Failed to create test cases: ${response.statusText}`);
  }

  // The response contains test case IDs and upload URLs for screenshots
  const { test_cases } = await response.json();
  return test_cases;
}

/**
 * Step 2: Upload screenshots to S3 using the provided upload URLs.
 */
async function uploadScreenshots(testCasesWithUrls) {
  for (const testCase of testCasesWithUrls) {
    if (testCase.screenshots) {
      for (const screenshot of testCase.screenshots) {
        // Find the local file path (you must provide this in your original testCases array)
        if (!screenshot.localPath) {
          console.warn(`No localPath for screenshot ${screenshot.name}, skipping upload.`);
          continue;
        }
        const fileBuffer = await fs.readFile(screenshot.localPath);

        // Upload the file to S3 using the pre-signed URL
        const uploadResponse = await fetch(screenshot.uploadUrl, {
          method: 'PUT',
          body: fileBuffer,
          headers: {
            'Content-Type': getContentType(screenshot.name)
          }
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload screenshot ${screenshot.name}: ${uploadResponse.statusText}`);
        }
        console.log(`Uploaded screenshot: ${screenshot.name}`);
      }
    }
  }
}

/**
 * Step 3: Update the test case with the final S3 paths after upload.
 */
async function updateTestCaseScreenshots(apiBaseUrl, apiKey, projectId, testCase) {
  // Prepare the screenshots array with S3 paths and timestamps
  const screenshotsToUpdate = (testCase.screenshots || []).map(s => ({
    name: s.name,
    path: s.s3Path, // This is the S3 path returned by the server
    timestamp: s.timestamp
  }));

  // Send the update request
  const response = await fetch(
    `${apiBaseUrl}/api/v1/projects/${projectId}/test-cases/${testCase.id}/screenshots`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ screenshots: screenshotsToUpdate })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update screenshots for test case ${testCase.id}: ${response.statusText}`);
  }
  console.log(`Updated screenshots for test case: ${testCase.id}`);
}

/**
 * Example usage
 */
async function main() {
  const apiBaseUrl = 'http://localhost:3000'; // Your API base URL
  const apiKey = 'omni_live_ecc1acg7FV0JR4HsBftqyakKUJjwDbzvh1cm-_7aBMQ';
  const projectId = 'b3d59af9-c810-4f48-8e1e-edf25e5ad26f';
  const buildId = '08910ccd-fae1-495e-841a-add1e10a4beb';

  // Prepare your test cases with local screenshot file paths
  const testCases = [
    {
      name: "Login Test with email",
      module: "Signup",
      status: "failed",
      duration: 4000,
      error_message: "Registration failed: Server timeout while waiting for response",
      error_stack_trace: "Error: Registration failed...",
      stdout: [
        {
          timestamp: "2024-04-25T10:15:30.123Z",
          level: "INFO",
          message: "Starting User Registration Test"
        }
      ],
      screenshots: [
        {
          name: "error-step1.png",
          timestamp: "2024-04-30T12:00:00Z",
          localPath: "/path/to/local/error-step1.png"
        },
        {
          name: "error-step2.png",
          timestamp: "2024-04-30T12:00:00Z",
          localPath: "/path/to/local/error-step2.png"
        }
      ],
      steps: []
    }
  ];

  // Step 1: Create test cases and get upload URLs
  const testCasesWithUrls = await createTestCasesWithScreenshots(
    apiBaseUrl, apiKey, projectId, buildId, testCases
  );

  // Step 2: Upload screenshots
  // Attach localPath to each screenshot in testCasesWithUrls for upload
  for (let i = 0; i < testCasesWithUrls.length; i++) {
    if (testCasesWithUrls[i].screenshots) {
      for (let j = 0; j < testCasesWithUrls[i].screenshots.length; j++) {
        // Attach localPath from original testCases array
        testCasesWithUrls[i].screenshots[j].localPath = testCases[i].screenshots[j].localPath;
      }
    }
  }
  await uploadScreenshots(testCasesWithUrls);

  // Step 3: Update test cases with S3 paths
  for (const testCase of testCasesWithUrls) {
    await updateTestCaseScreenshots(apiBaseUrl, apiKey, projectId, testCase);
  }

  console.log('All test cases and screenshots processed successfully!');
}

// Run the example
main().catch(err => {
  console.error('Error:', err);
});