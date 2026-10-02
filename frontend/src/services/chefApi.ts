import { api } from "../lib/api";

export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  job_title?: string | null;
  phone?: string | null;
  avatar_path?: string | null;
  weekly_capacity?: number | null;
  open_tasks_count?: number;
  done_tasks_count?: number;
};

export type Team = {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  projects_count?: number;
  members: Pick<Member, "id" | "first_name" | "last_name" | "email" | "job_title">[];
};

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type Task = {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours: number;
  spent_hours: number;
  due_date?: string | null;
  assigned_to?: number | null;
  assignee?: { id: number; first_name: string; last_name: string; job_title?: string | null } | null;
  project?: { id: number; name: string };
};

export type ProjectLite = {
  id: number;
  name: string;
  status: string;
  progress?: number;
  deadline?: string | null;
};

export type Tracking = {
  project: {
    id: number; name: string; description: string | null; status: string; progress: number;
    start_date: string | null; deadline: string | null; risk_level: string | null;
    planned_effort: number; predicted_effort: number | null;
  };
  team: { id: number; first_name: string; last_name: string; job_title?: string | null; email: string }[];
  stats: {
    by_status: Record<TaskStatus, number>;
    by_priority: Record<TaskPriority, number>;
    total_hours: number; done_hours: number; spent_hours: number; tasks_late: number;
  };
  workload: { id: number; name: string; job_title?: string | null; tasks_total: number; tasks_done: number; open_hours: number; capacity: number }[];
  burndown: { date: string; ideal: number; actual: number | null }[];
  forecast: {
    velocity_per_day: number; remaining_hours: number; eta: string | null;
    deadline: string | null; days_late: number | null; on_track: boolean | null;
  };
  health: { score: number; label: string; reasons: string[] };
  activities: { id: number; type: string; message: string; user: string | null; created_at: string }[];
};

export type Overview = {
  projects: {
    id: number; name: string; status: string; progress: number; deadline: string | null;
    risk_level: string | null; tasks_total: number; tasks_done: number; tasks_late: number; team_size: number;
  }[];
  totals: {
    projects: number; in_progress: number; completed: number; avg_progress: number;
    tasks_total: number; tasks_done: number; tasks_late: number;
  };
};

export const chefApi = {
  members: () => api.get<{ members: Member[] }>("/chef/team").then((r) => r.data.members),
  createMember: (d: Partial<Member> & { password?: string }) => api.post("/chef/team", d).then((r) => r.data),
  updateMember: (id: number, d: Partial<Member>) => api.put(`/chef/team/${id}`, d).then((r) => r.data),
  deleteMember: (id: number) => api.delete(`/chef/team/${id}`),

  teams: () => api.get<{ teams: Team[] }>("/chef/teams").then((r) => r.data.teams),
  createTeam: (d: { name: string; description?: string; color?: string; member_ids: number[] }) =>
    api.post("/chef/teams", d).then((r) => r.data),
  updateTeam: (id: number, d: { name?: string; description?: string; color?: string; member_ids?: number[] }) =>
    api.put(`/chef/teams/${id}`, d).then((r) => r.data),
  deleteTeam: (id: number) => api.delete(`/chef/teams/${id}`),

  projects: () => api.get<ProjectLite[]>("/projects").then((r) => r.data),
  updateProject: (id: number, d: Record<string, unknown>) => api.put(`/projects/${id}`, d).then((r) => r.data),
  deleteProject: (id: number) => api.delete(`/projects/${id}`),
  assignTeam: (projectId: number, teamId: number | null) =>
    api.put(`/projects/${projectId}/team`, { team_id: teamId }),
  addProjectMember: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/members`, { user_id: userId }),
  removeProjectMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
  autoAssign: (projectId: number) =>
    api.post<{ assigned: unknown[]; message: string }>(`/projects/${projectId}/auto-assign`).then((r) => r.data),
  generateTasks: (projectId: number, count = 6) =>
    api.post<{ tasks: Task[]; source: string }>(`/projects/${projectId}/generate-tasks`, { count }).then((r) => r.data),

  tasks: (params?: Record<string, unknown>) =>
    api.get<{ tasks: Task[] }>("/tasks", { params }).then((r) => r.data.tasks),
  createTask: (d: Record<string, unknown>) => api.post<Task>("/tasks", d).then((r) => r.data),
  updateTask: (id: number, d: Record<string, unknown>) => api.put<Task>(`/tasks/${id}`, d).then((r) => r.data),
  deleteTask: (id: number) => api.delete(`/tasks/${id}`),

  overview: () => api.get<Overview>("/tracking/overview").then((r) => r.data),
  tracking: (id: number) => api.get<Tracking>(`/tracking/projects/${id}`).then((r) => r.data),
};
