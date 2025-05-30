import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { configureOmniTest, OmniService } from 'omni-test-intelligence';

const ENV_PATH = path.join(__dirname, '.env');

async function globalSetup() {
  // Load existing env vars
  dotenv.config({ path: ENV_PATH });

  // Initialize config from existing env
  configureOmniTest({
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
  });

  // Start build
  const build = await OmniService.startBuild();
  const buildId = build.build_id;

  console.log('🌍 Global Setup: Build started:', buildId);

  // Read current .env
  let envContents = await fs.readFile(ENV_PATH, 'utf-8');

  // Remove any existing BUILD_ID line
  envContents = envContents.replace(/^BUILD_ID=.*$/m, '');

  // Append updated BUILD_ID
  envContents += `\nBUILD_ID=${buildId}\n`;

  // Write back to .env
  await fs.writeFile(ENV_PATH, envContents.trim() + '\n');
}

export default globalSetup;
