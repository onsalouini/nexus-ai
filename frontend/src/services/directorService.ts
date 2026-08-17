import { api } from "../lib/api";

import type {
  DirectorInvitation,
  DirectorProject,
  DirectorTeamMember,
} from "../types/director";


export type DirectorDashboardData = {
  director: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string | null;
    job_title: string | null;
    avatar_path: string | null;
  };

  company: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    industry: string | null;
    employees_count: number | null;
  };

  stats: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    high_risk_projects: number;

    total_members: number;
    project_managers: number;

    pending_invitations: number;
    accepted_invitations: number;

    average_risk: number;
    health_score: number;
  };

  projects: DirectorProject[];

  team: DirectorTeamMember[];

  invitations: DirectorInvitation[];

  ai: {
    health_score: number;
    average_risk: number;
    high_risk_projects: number;
  };
};


export async function getDirectorDashboard(): Promise<DirectorDashboardData> {
  const response = await api.get<DirectorDashboardData>(
    "/director/dashboard"
  );

  return response.data;
}