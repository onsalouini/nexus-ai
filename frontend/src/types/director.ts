export type DirectorProject = {
  id: number;
  name: string;
  description: string | null;
  company_id: number;
  chef_de_projet_id: number | null;
  status: string;

  team_exp: number | null;
  manager_exp: number | null;
  length: number | null;
  transactions: number | null;
  entities: number | null;

  points_non_adjust: number | null;
  adjustment: number | null;
  points_adjust: number | null;

  language: string | null;

  planned_effort: number | null;
  predicted_effort: number | null;

  risk_score: number | null;
  risk_level: string | null;

  created_at?: string;
  updated_at?: string;

  chef_de_projet?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string | null;
  } | null;
};


export type DirectorTeamMember = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  job_title: string | null;
  avatar_path: string | null;
  company_id: number;
};


export type DirectorInvitation = {
  id: number;
  email: string;
  first_name: string | null;
  role: string | null;
  token: string;
  company_id: number;
  invited_by: number | null;
  expires_at: string;
  accepted_at: string | null;
  created_at?: string;
  updated_at?: string;
};