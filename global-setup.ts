// global-setup.ts
import axios from 'axios';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

const HEADERS = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function globalSetup() {
  const createUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=production`;
  const payload = {
    duration: 0,
    environment: 'production',
    status: 'in_progress',
  };

  const res = await axios.post(createUrl, payload, { headers: HEADERS });
  const buildId = res.data.build.build_id;

  console.log('✅ Global Setup: Build started:', buildId);

  // Save buildId to a temp file
  await fs.writeFile('build-meta.json', JSON.stringify({ buildId }, null, 2));
}

export default globalSetup;
