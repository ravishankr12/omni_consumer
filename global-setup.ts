import fs from 'fs/promises';
import { BuildService } from './src/lib/build-service';

async function globalSetup() {
  const build = await BuildService.startBuild();
  const buildId = build.build_id;

  console.log('Global Setup: Build started:', buildId);

  // Save buildId to a temp file
  await fs.writeFile('build-meta.json', JSON.stringify({ buildId }, null, 2));
}

export default globalSetup;
