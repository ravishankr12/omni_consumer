import fs from "fs/promises";
import { configureOmniTest, OmniService } from "omni-test-intelligence"

async function globalSetup() {
  // Initialize config from environment variables
  configureOmniTest({
    baseUrl: process.env.BASE_URL!,
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
  });

  // Start build
  const build = await OmniService.startBuild();
  const buildId = build.build_id;

  console.log("Global Setup: Build started:", buildId);

  // Save buildId to a temp file
  await fs.writeFile("build-meta.json", JSON.stringify({ buildId }, null, 2));
}

export default globalSetup;
