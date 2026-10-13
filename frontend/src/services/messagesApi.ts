import { api } from "../lib/api";
import type { PersonRef } from "./workspaceApi";

/* ---------------- Messagerie interne ---------------- */

export type Contact = PersonRef & { role: string; job_title?: string | null; organization?: string | null };

export type ConversationSummary = {
  id: number;
  other: Contact | null;
  last_message: { body: string; user_id: number; created_at: string } | null;
  unread: number;
};

export type DirectMessage = { id: number; conversation_id: number; user_id: number | null; body: string; created_at: string };

export const messagesApi = {
  contacts: () => api.get<Contact[]>("/messages/contacts").then((r) => r.data),
  conversations: () =>
    api.get<{ conversations: ConversationSummary[]; unread: number }>("/messages/conversations").then((r) => r.data),
  start: (userId: number) => api.post<ConversationSummary>("/messages/conversations", { user_id: userId }).then((r) => r.data),
  show: (id: number, after?: number) =>
    api
      .get<{ conversation: { id: number; other: Contact | null }; other_read_id: number | null; messages: DirectMessage[] }>(
        `/messages/conversations/${id}`,
        { params: after ? { after } : undefined }
      )
      .then((r) => r.data),
  send: (id: number, body: string) => api.post<DirectMessage>(`/messages/conversations/${id}`, { body }).then((r) => r.data),
  unread: () => api.get<{ unread: number }>("/messages/unread").then((r) => r.data.unread),
};
