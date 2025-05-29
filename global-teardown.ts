import fs from "fs/promises";
import { configureOmniTest, OmniService } from "omni-test-intelligence";

async function globalTeardown() {
  // Initialize config from environment variables
  configureOmniTest({
    baseUrl: process.env.BASE_URL!,
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
  });

  // Read build ID from file
  const data = await fs.readFile("build-meta.json", "utf-8");
  const { buildId } = JSON.parse(data);

  // Complete build
  const complete = await OmniService.completeBuild(buildId, "passed", 800, "production");
  console.log("Global Teardown: Build completed:", complete);
}

export default globalTeardown;
