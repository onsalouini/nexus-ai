// src/components/chat/NexusChat.tsx
// Interface du chatbot NEXUS AI (branchée sur les routes Laravel /api/ai/*)
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import axios from "axios";
import {
  BrainCircuit,
  FileText,
  Loader2,
  MessageSquare,
  PanelLeft,
  Paperclip,
  Plus,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "../../lib/api";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Role = "user" | "assistant";

type ChatMessage = {
  id: number | string;
  role: Role;
  content: string;
  created_at?: string;
  error?: boolean;
};

type Conversation = {
  id: number;
  title: string | null;
  updated_at: string;
};

type UploadedDoc = {
  name: string;
  chars: number;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  "Comment répartir les tâches dans une équipe de 5 développeurs ?",
  "Quels sont les principaux risques d'un projet qui dépasse son budget d'effort ?",
  "Aide-moi à planifier un projet de 6 mois en sprints.",
  "Comment prioriser mon backlog quand tout semble urgent ?",
];

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.message ||
      err.response?.data?.errors?.file?.[0] ||
      fallback
    );
  }
  return fallback;
}

/** Rendu Markdown minimal (gras, code, listes, titres, tableaux) sans dépendance. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[] = [];

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l${blocks.length}`}
        className={`my-2 space-y-1 pl-5 ${
          list.ordered ? "list-decimal" : "list-disc"
        } marker:text-cyan-300/70`}
      >
        {list.items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  const flushTable = () => {
    if (table.length === 0) return;
    blocks.push(
      <div
        key={`t${blocks.length}`}
        className="my-2 overflow-x-auto rounded-xl border border-white/[0.08]"
      >
        <pre className="p-3 font-mono text-xs leading-5 text-slate-300">
          {table.join("\n")}
        </pre>
      </div>
    );
    table = [];
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();

    if (line.trim().startsWith("|")) {
      flushList();
      table.push(line);
      return;
    }
    flushTable();

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      return;
    }

    flushList();

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push(
        <p
          key={`h${blocks.length}`}
          className="mb-1 mt-3 text-sm font-semibold text-cyan-200"
        >
          {renderInline(heading[1])}
        </p>
      );
      return;
    }

    if (line.trim() === "") return;

    blocks.push(
      <p key={`p${blocks.length}`} className="my-1.5">
        {renderInline(line)}
      </p>
    );
  });

  flushList();
  flushTable();

  return <div className="text-sm leading-6 text-slate-200">{blocks}</div>;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ------------------------------------------------------------------ */
/* Composant                                                          */
/* ------------------------------------------------------------------ */

export default function NexusChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- chargement de la liste ---------- */

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get<Conversation[]>("/ai/conversations");
      setConversations(res.data);
    } catch {
      /* la liste est un confort : on ignore l'erreur */
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  /* ---------- scroll auto ---------- */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  /* ---------- auto-resize du champ ---------- */

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  /* ---------- actions ---------- */

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setDocs([]);
    setError(null);
    setPanelOpen(false);
    textareaRef.current?.focus();
  }

  async function openConversation(id: number) {
    setPanelOpen(false);
    if (id === activeId) return;

    setActiveId(id);
    setMessages([]);
    setDocs([]);
    setError(null);
    setLoadingConv(true);

    try {
      const res = await api.get<{ messages: ChatMessage[] }>(
        `/ai/conversations/${id}`
      );
      setMessages(res.data.messages ?? []);
    } catch (err) {
      setError(errorMessage(err, "Impossible de charger cette conversation."));
    } finally {
      setLoadingConv(false);
    }
  }

  async function ensureConversation(title: string): Promise<number> {
    if (activeId !== null) return activeId;

    const res = await api.post<Conversation>("/ai/conversations", {
      title: title.slice(0, 60),
    });
    setActiveId(res.data.id);
    setConversations((prev) => [res.data, ...prev]);
    return res.data.id;
  }

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    setError(null);
    setSending(true);
    setInput("");

    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content }]);

    try {
      const conversationId = await ensureConversation(content);

      const res = await api.post<{
        user_message: ChatMessage;
        assistant_message: ChatMessage;
      }>(`/ai/conversations/${conversationId}/messages`, { content });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        res.data.user_message,
        res.data.assistant_message,
      ]);

      void loadConversations();
    } catch (err) {
      // 503 : le message utilisateur est déjà enregistré côté serveur
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errorMessage(
            err,
            "NEXUS AI est temporairement indisponible. Réessaie dans un instant."
          ),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Le PDF ne doit pas dépasser 10 Mo.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const conversationId = await ensureConversation(file.name);

      const form = new FormData();
      form.append("file", file);

      const res = await api.post<{ text_length: number }>(
        `/ai/conversations/${conversationId}/attachments`,
        form
      );

      setDocs((prev) => [
        ...prev,
        { name: file.name, chars: res.data.text_length },
      ]);
    } catch (err) {
      setError(errorMessage(err, "Impossible d'analyser ce PDF."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  /* ---------- rendu ---------- */

  const isEmpty = messages.length === 0 && !loadingConv;

  return (
    <div className="relative flex h-[calc(100dvh-9rem)] min-h-[520px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B1628]/80">
      {/* ================= LISTE DES CONVERSATIONS ================= */}

      <div
        onClick={() => setPanelOpen(false)}
        className={`absolute inset-0 z-20 bg-black/50 transition-opacity md:hidden ${
          panelOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`absolute inset-y-0 left-0 z-30 flex w-[270px] flex-col border-r border-white/[0.06] bg-[#08111f] transition-transform md:static md:translate-x-0 ${
          panelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3">
          <button
            type="button"
            onClick={newConversation}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Nouvelle conversation
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {loadingList ? (
            <p className="px-3 py-4 text-xs text-slate-500">Chargement…</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-500">
              Aucune conversation pour le moment.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void openConversation(c.id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  c.id === activeId
                    ? "border-cyan-400/20 bg-cyan-400/[0.07] text-white"
                    : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-cyan-300/70" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {c.title || "Nouvelle conversation"}
                </span>
                <span className="shrink-0 text-[10px] text-slate-600">
                  {formatDate(c.updated_at)}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ================= ZONE DE CHAT ================= */}

      <section className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <button
            type="button"
            aria-label="Conversations"
            onClick={() => setPanelOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:text-white md:hidden"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300">
            <BrainCircuit className="h-[18px] w-[18px]" />
          </span>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white">NEXUS AI</h1>
            <p className="text-[11px] text-slate-500">
              Assistant gestion de projets & équipes
            </p>
          </div>
        </header>

        {/* messages */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {loadingConv ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="text-lg font-semibold text-white">
                Comment puis-je t'aider ?
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Planification, tâches, équipe, risques… Tu peux aussi joindre
                un PDF (cahier des charges, planning) à analyser.
              </p>

              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left text-xs leading-5 text-slate-300 transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.05] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.12] to-blue-500/[0.10] px-4 py-2.5 text-sm leading-6 text-white">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300">
                      <BrainCircuit className="h-4 w-4" />
                    </span>
                    <div
                      className={`min-w-0 max-w-[90%] rounded-2xl rounded-tl-md border px-4 py-2.5 ${
                        m.error
                          ? "border-rose-400/20 bg-rose-400/[0.05] text-rose-200"
                          : "border-white/[0.07] bg-white/[0.03]"
                      }`}
                    >
                      {m.error ? (
                        <p className="text-sm">{m.content}</p>
                      ) : (
                        <MessageContent content={m.content} />
                      )}
                    </div>
                  </div>
                )
              )}

              {sending && (
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300">
                    <BrainCircuit className="h-4 w-4" />
                  </span>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        style={{ animationDelay: `${delay}ms` }}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300/70"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* composer */}
        <footer className="border-t border-white/[0.06] p-3 sm:p-4">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-rose-400/15 bg-rose-400/[0.05] px-4 py-2.5 text-xs text-rose-200/90">
                <span>{error}</span>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setError(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {docs.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {docs.map((d, i) => (
                  <span
                    key={`${d.name}-${i}`}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{d.name}</span>
                    <span className="shrink-0 text-emerald-300/60">
                      · analysé
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 transition focus-within:border-cyan-400/40">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />

              <button
                type="button"
                aria-label="Joindre un PDF"
                title="Joindre un PDF"
                disabled={uploading || sending}
                onClick={() => fileRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.05] hover:text-cyan-300 disabled:opacity-40"
              >
                {uploading ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                ) : (
                  <Paperclip className="h-[18px] w-[18px]" />
                )}
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Écris ton message…"
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
              />

              <button
                type="button"
                aria-label="Envoyer"
                disabled={!input.trim() || sending}
                onClick={() => void sendMessage(input)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <SendHorizontal className="h-[18px] w-[18px]" />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-600">
              Entrée pour envoyer · Maj+Entrée pour un retour à la ligne
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}
