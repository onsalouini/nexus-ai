import { api } from "../lib/api";

export type ProjectMember = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  avatar_path: string | null;
};

export type DirectorProject = {
  id: number;

  name: string;
  description: string | null;

  company_id: number;
  chef_de_projet_id: number;

  status: string;

  // ─────────────────────────────
  // Données utilisées par NEXUS AI
  // ─────────────────────────────

  team_exp: number;
  manager_exp: number;

  length: number;

  transactions: number;
  entities: number;

  points_non_adjust: number;
  adjustment: number;
  points_adjust: number | null;

  language: number;

  planned_effort: number;
  predicted_effort: number | null;

  risk_score: number | null;
  risk_level: string | null;

  // ─────────────────────────────
  // Relations Laravel
  // ─────────────────────────────

  chef_de_projet: ProjectMember;

  team: ProjectMember[];
};

export async function getDirectorProjects(): Promise<DirectorProject[]> {
  const response = await api.get<DirectorProject[]>(
    "/director/projects"
  );

  return response.data;
}

export async function getDirectorProject(
  id: number
): Promise<DirectorProject> {
  const response = await api.get<DirectorProject>(
    `/director/projects/${id}`
  );

  return response.data;
}