import { api } from "../lib/api";
import type { PersonRef, Ticket } from "./workspaceApi";

/* ---------------- Espace client externe ---------------- */

export type ClientSchedule = "on_track" | "watch" | "late" | "done";

export type ClientProject = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  progress: number;
  start_date?: string | null;
  deadline?: string | null;
  chef?: (PersonRef & { email: string }) | null;
  schedule: ClientSchedule;
  tasks: { total: number; done: number; in_progress: number };
  recent_done: { title: string; date: string }[];
  upcoming: { title: string; date: string }[];
  open_tickets: number;
};

export type ChangeRequestStatus = "pending" | "accepted" | "in_progress" | "done" | "rejected";
export type ChangeRequestPriority = "low" | "normal" | "high";

export type ChangeRequest = {
  id: number;
  project_id: number;
  title: string;
  description: string;
  priority: ChangeRequestPriority;
  status: ChangeRequestStatus;
  response?: string | null;
  responded_at?: string | null;
  created_at: string;
  responder?: { id: number; first_name: string; last_name: string } | null;
  project?: { id: number; name: string };
  client?: (PersonRef & { email: string; organization?: string | null }) | null;
};

export type ClientProjectDetail = {
  project: Omit<ClientProject, "tasks" | "recent_done" | "upcoming" | "open_tickets">;
  evolution: { date: string; planned: number; actual: number | null }[];
  tasks: { id: number; title: string; status: "todo" | "in_progress" | "review" | "done"; priority: string; due_date: string | null }[];
  timeline: { type: string; title: string; date: string }[];
  change_requests: ChangeRequest[];
};

export const clientApi = {
  project: (id: number) => api.get<ClientProjectDetail>(`/client/projects/${id}`).then((r) => r.data),
  requestChange: (projectId: number, d: { title: string; description: string; priority: ChangeRequestPriority }) =>
    api.post<ChangeRequest>(`/client/projects/${projectId}/change-requests`, d).then((r) => r.data),
  projects: () => api.get<{ projects: ClientProject[] }>("/client/projects").then((r) => r.data.projects),
  tickets: () => api.get<{ tickets: Ticket[] }>("/client/tickets").then((r) => r.data.tickets),
  ticket: (id: number) => api.get<Ticket>(`/client/tickets/${id}`).then((r) => r.data),
  createTicket: (d: { title: string; description: string; project_id?: number | null }) =>
    api.post<Ticket>("/client/tickets", d).then((r) => r.data),
  reply: (id: number, body: string) => api.post<Ticket>(`/client/tickets/${id}/messages`, { body }).then((r) => r.data),
  close: (id: number) => api.post<Ticket>(`/client/tickets/${id}/close`).then((r) => r.data),
};
