// global-teardown.ts
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

async function globalTeardown() {
  const data = await fs.readFile('build-meta.json', 'utf-8');
  const { buildId } = JSON.parse(data);

  const completeUrl = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${buildId}`;
  const payload = {
    progress_status: 'completed',
    status: 'passed', // or calculate final status dynamically if needed
    duration: 800,
    environment: 'production',
  };

  const res = await axios.patch(completeUrl, payload, {
    headers: HEADERS,
  });

  console.log('🏁 Global Teardown: Build completed:', res.data);
}

export default globalTeardown;
