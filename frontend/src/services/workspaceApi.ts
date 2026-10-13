import { api } from "../lib/api";
import type { TaskPriority, TaskStatus } from "./chefApi";

/* ---------------- Espace employé ---------------- */

export type MyTask = {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours: number;
  spent_hours: number;
  due_date?: string | null;
  project?: { id: number; name: string; deadline?: string | null };
  creator?: { id: number; first_name: string; last_name: string } | null;
};

export type MyProject = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  progress: number;
  start_date?: string | null;
  deadline?: string | null;
  my_open_tasks: number;
  my_done_tasks: number;
  chef_de_projet?: { id: number; first_name: string; last_name: string; email: string } | null;
};

/* ---------------- Tickets ---------------- */

export type TicketCategory = "bug" | "billing" | "feature" | "account" | "other";
export type TicketUrgency = "low" | "medium" | "high" | "critical";
export type TicketSentiment = "negative" | "neutral" | "positive";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type Ticket = {
  id: number;
  title: string;
  description: string;
  customer_name?: string | null;
  customer_email?: string | null;
  category: TicketCategory;
  urgency: TicketUrgency;
  sentiment: TicketSentiment;
  status: TicketStatus;
  classification_corrected: boolean;
  assigned_to?: number | null;
  assignee?: PersonRef | null;
  created_by?: number | null;
  creator?: (PersonRef & { role: string | null }) | null;
  project_id?: number | null;
  project?: { id: number; name: string } | null;
  triage_source?: "ml" | "groq" | "keywords" | null;
  triage_confidence?: Partial<Record<"category" | "urgency" | "sentiment", number>> | null;
  messages_count?: number;
  messages?: TicketMessage[];
  created_at: string;
  resolved_at?: string | null;
};

export type PersonRef = {
  id: number;
  first_name: string;
  last_name: string;
  avatar_path?: string | null;
  avatar_color?: string | null;
};

export type TicketMessage = {
  id: number;
  body: string;
  created_at: string;
  user_id: number | null;
  author?: (PersonRef & { role: string | null }) | null;
};

export type TicketModelStatus = {
  model: {
    version: string;
    trained_at: string;
    n_samples: number;
    n_feedback: number;
    sources: string[];
    metrics: Record<"holdout" | "handwritten", Partial<Record<"category" | "urgency" | "sentiment", { accuracy: number; f1_macro: number; n: number }>>>;
  } | null;
  corrections: number;
  sources: Partial<Record<"ml" | "groq" | "keywords", number>>;
};

export type TicketStats = {
  open: number;
  in_progress: number;
  resolved: number;
  critical_open: number;
  mine: number;
};

/* ---------------- Notifications ---------------- */

export type NotificationType =
  | "task_late"
  | "task_due_soon"
  | "task_assigned"
  | "task_completed"
  | "project_high_risk"
  | "project_risk_alert"
  | "bankruptcy_alert"
  | "project_late_tasks"
  | "invitation_accepted"
  | "ticket_critical"
  | "ticket_new"
  | "ticket_assigned"
  | "ticket_reply"
  | "ticket_client_reply"
  | "ticket_in_progress"
  | "ticket_resolved"
  | "ai_report_auto"
  | "message_new"
  | "change_request_new"
  | "change_request_updated";

export type AppNotification = {
  id: number;
  type: NotificationType;
  severity: "info" | "warning" | "critical";
  data: Record<string, string | number | null>;
  created_at: string;
  link: string | null;
  read: boolean;
};

/* ---------------- Alertes de risque ---------------- */

export type RiskAlerts = {
  thresholds: { risk: number; bankruptcy: number };
  projects: { id: number; name: string; risk_level: string | null; risk_score: number | null }[];
  bankruptcy: { probability: number; health_score: number; alert: boolean; date: string } | null;
};

export type ClientAccount = PersonRef & { email: string; client_projects: { id: number; name: string }[] };

/* ---------------- Direction ---------------- */

export type HealthScore = {
  score: number | null;
  label: string | null;
  weights: Record<"projects" | "support" | "finance", number>;
  components: {
    projects: { score: number | null; count: number; at_risk: { id: number; name: string; score: number; risk_level: string | null }[] };
    support: { score: number | null; open: number; resolved: number; critical_open: number };
    finance: { score: number | null; financial_health: "healthy" | "at_risk" | null; report_date: string | null };
  };
};

export type AuditEntry = {
  id: number;
  action: string;
  meta: Record<string, string | number> | null;
  ip: string | null;
  created_at: string;
  user?: { id: number; first_name: string; last_name: string; email: string; role: string } | null;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type ProjectReportEntry = {
  id: number;
  trigger: "manual" | "auto";
  created_at: string;
  planned_effort: number | null;
  predicted_effort: number | null;
  risk_level: string | null;
  risk_score: number | null;
  report: {
    summary: string;
    health: string;
    strengths: string[];
    risks: { title: string; description: string; severity: string }[];
    recommendations: string[];
    final_verdict: string;
  };
  author?: { id: number; first_name: string; last_name: string } | null;
};

export const workspaceApi = {
  myTasks: () => api.get<{ tasks: MyTask[] }>("/me/tasks").then((r) => r.data.tasks),
  updateMyTask: (id: number, d: { status?: TaskStatus; spent_hours?: number }) =>
    api.patch<MyTask>(`/me/tasks/${id}`, d).then((r) => r.data),
  myProjects: () => api.get<{ projects: MyProject[] }>("/me/projects").then((r) => r.data.projects),

  tickets: (params?: { status?: TicketStatus; mine?: boolean }) =>
    api
      .get<{ tickets: Ticket[]; stats: TicketStats }>("/tickets", {
        params: { ...params, mine: params?.mine ? 1 : undefined },
      })
      .then((r) => r.data),
  createTicket: (d: { title: string; description: string; customer_name?: string; customer_email?: string }) =>
    api.post<Ticket>("/tickets", d).then((r) => r.data),
  updateTicket: (id: number, d: Partial<Pick<Ticket, "status" | "assigned_to" | "category" | "urgency" | "sentiment">>) =>
    api.patch<Ticket>(`/tickets/${id}`, d).then((r) => r.data),
  ticket: (id: number) => api.get<Ticket>(`/tickets/${id}`).then((r) => r.data),
  replyTicket: (id: number, body: string) => api.post<Ticket>(`/tickets/${id}/messages`, { body }).then((r) => r.data),
  suggestReply: (id: number) => api.post<{ reply: string }>(`/tickets/${id}/suggest-reply`).then((r) => r.data.reply),
  ticketModel: () => api.get<TicketModelStatus>("/tickets/model").then((r) => r.data),
  retrainTicketModel: () => api.post<{ samples: number }>("/tickets/model/retrain", {}, { timeout: 200_000 }).then((r) => r.data),

  notifications: () =>
    api.get<{ notifications: AppNotification[]; unread: number }>("/notifications").then((r) => r.data),
  markNotificationsRead: () => api.post("/notifications/read"),
  markNotificationRead: (id: number) => api.post<{ unread: number }>(`/notifications/${id}/read`).then((r) => r.data),
  deleteNotification: (id: number) => api.delete<{ unread: number }>(`/notifications/${id}`).then((r) => r.data),

  alerts: () => api.get<RiskAlerts>("/alerts").then((r) => r.data),
  saveAlertThresholds: (d: { risk_alert_threshold: number; bankruptcy_alert_threshold: number }) =>
    api.put<{ risk: number; bankruptcy: number }>("/alerts/settings", d).then((r) => r.data),
  savePreferences: (d: { email_alerts?: boolean; avatar_color?: string }) => api.put("/account/preferences", d),

  clients: () => api.get<ClientAccount[]>("/clients").then((r) => r.data),
  assignClient: (projectId: number, clientId: number | null) =>
    api.put(`/projects/${projectId}/client`, { client_id: clientId }).then((r) => r.data),

  healthScore: () => api.get<HealthScore>("/director/health-score").then((r) => r.data),
  auditLogs: (params: { page?: number; action?: string }) =>
    api.get<Paginated<AuditEntry>>("/audit-logs", { params }).then((r) => r.data),

  projectReports: (projectId: number) =>
    api.get<ProjectReportEntry[]>(`/projects/${projectId}/reports`).then((r) => r.data),

  resendInvitation: (id: number) => api.post(`/invitations/${id}/resend`).then((r) => r.data),
  cancelInvitation: (id: number) => api.delete(`/invitations/${id}`).then((r) => r.data),

  setup2fa: () => api.post<{ secret: string; otpauth_uri: string }>("/account/2fa/setup").then((r) => r.data),
  enable2fa: (code: string) => api.post("/account/2fa/enable", { code }).then((r) => r.data),
  disable2fa: (password: string, code: string) =>
    api.post("/account/2fa/disable", { password, code }).then((r) => r.data),
  saveLocale: (locale: string) => api.put("/account/locale", { locale }),
};
