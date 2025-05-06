import axios from 'axios';
import {
  Build,
  GetBuildsResponse,
  StartBuildResponse,
  CompleteBuildResponse,
} from './api-clients/types/build-response';

const BASE_URL = process.env.BASE_URL!;
const PROJECT_ID = process.env.PROJECT_ID!;
const API_KEY = process.env.API_KEY!;

const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const BuildService = {
  async getBuilds(days = 7, environment = 'production'): Promise<GetBuildsResponse> {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=${days}&environment=${environment}`;
    const response = await axios.get<GetBuildsResponse>(url, { headers });
    return response.data;
  },

  async startBuild(environment = 'production'): Promise<Build> {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/builds?days=7&environment=${environment}`;
    const payload = {
      duration: 0,
      environment,
      status: 'in_progress',
    };
    const response = await axios.post<StartBuildResponse>(url, payload, { headers });
    return response.data.build;
  },

  async completeBuild(
    buildId: string,
    status: string,
    duration: number,
    environment = 'production'
  ): Promise<Build> {
    const url = `${BASE_URL}/projects/${PROJECT_ID}/builds?build_id=${buildId}`;
    const payload = {
      progress_status: 'completed',
      status,
      duration,
      environment,
    };
    const response = await axios.patch<CompleteBuildResponse>(url, payload, { headers });
    return response.data.build;
  },
};
