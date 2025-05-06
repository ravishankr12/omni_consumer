export interface Build {
  build_id: string;
  project_id: string;
  environment: string;
  status: string;
  duration: number;
  [key: string]: any; // fallback for unknown props
}

export interface GetBuildsResponse {
  builds: Build[];
}

export interface StartBuildResponse {
  build: Build;
}

export interface CompleteBuildResponse {
  build: Build;
}
