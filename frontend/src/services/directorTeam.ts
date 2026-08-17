import { api } from "../lib/api";

export type TeamMember = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  company_id: number;
  manager_id: number | null;
  job_title: string | null;
  avatar_path: string | null;
  cv_path: string | null;
};

export type TeamLeader = TeamMember & {
  team_members: TeamMember[];
};

export type MemberProject = {
  id: number;
  name: string;
  status: string;
  risk_score: number | null;
};

export type TeamMemberDetails = TeamMember & {
  manager: TeamMember | null;
  projects: MemberProject[];
};

export async function getDirectorTeam(): Promise<TeamLeader[]> {
  const response = await api.get<TeamLeader[]>("/director/team");

  return response.data;
}

export async function getTeamMember(
  id: number
): Promise<TeamMemberDetails> {
  const response = await api.get<TeamMemberDetails>(
    `/director/team/${id}`
  );

  return response.data;
}