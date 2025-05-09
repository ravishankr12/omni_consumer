import fs from 'fs/promises';
import { BuildService } from './src/lib/build-service';

async function globalTeardown() {
  // Read build ID from meta file
  const data = await fs.readFile('build-meta.json', 'utf-8');
  const { buildId } = JSON.parse(data);

  // Call reusable BuildService method
  const complete = await BuildService.completeBuild(buildId, 'passed', 800, 'production');
  console.log('🏁 Global Teardown: Build completed:', complete);
}

export default globalTeardown;
