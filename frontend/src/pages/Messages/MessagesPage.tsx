import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCheck, MessageSquarePlus, MessagesSquare, Search, Send } from "lucide-react";
import { messagesApi, type Contact, type ConversationSummary, type DirectMessage } from "../../services/messagesApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/ui-nexus/Avatar";
import { Modal, PageHeader, btnPrimary, cardCls, errMsg } from "../../components/ui-nexus/kit";
import { formatDate, formatRelative, formatTime } from "../../i18n/format";
import { roleLabel } from "../../i18n/labels";
import { refreshUnread } from "../../lib/unreadMessages";
import { toast } from "../../lib/toast";

const THREAD_POLL_MS = 6_000;
const LIST_POLL_MS = 20_000;

function subtitle(c?: Contact | null): string {
  if (!c) return "";
  return [roleLabel(c.role), c.organization || c.job_title].filter(Boolean).join(" · ");
}

/*
| Messagerie interne : chef ↔ direction, chef ↔ employés, client ↔ chef.
| Liens profonds : ?c=<conversation> (notification) ou ?with=<utilisateur> (bouton « Écrire »).
*/
export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [other, setOther] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherReadId, setOtherReadId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [picking, setPicking] = useState(false);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(0);

  const loadList = useCallback(async () => {
    try {
      setConversations((await messagesApi.conversations()).conversations);
    } catch (e) {
      toast.error(errMsg(e));
      setConversations((c) => c ?? []);
    }
  }, []);

  const open = useCallback(async (id: number) => {
    setActiveId(id);
    setMessages([]);
    lastId.current = 0;
    try {
      const data = await messagesApi.show(id);
      setOther(data.conversation.other);
      setMessages(data.messages);
      setOtherReadId(data.other_read_id);
      lastId.current = data.messages[data.messages.length - 1]?.id ?? 0;
      setConversations((list) => list?.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) ?? list);
      void refreshUnread();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);

  async function startWith(userId: number) {
    // On ferme la conversation affichée : rien ne doit partir au mauvais destinataire pendant le chargement
    setPicking(false);
    setActiveId(null);
    setMessages([]);
    try {
      const conversation = await messagesApi.start(userId);
      setPicking(false);
      await loadList();
      await open(conversation.id);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  useEffect(() => {
    void loadList();
    // Onglet en arrière-plan : on n'interroge pas le serveur
    const id = window.setInterval(() => !document.hidden && loadList(), LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadList]);

  // Liens profonds depuis une notification ou un bouton « Écrire à… »
  useEffect(() => {
    const c = Number(params.get("c"));
    const w = Number(params.get("with"));
    if (c) void open(c);
    else if (w) void startWith(w);
    if (c || w) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Nouveaux messages de la conversation ouverte
  useEffect(() => {
    if (!activeId) return;
    let busy = false;
    const id = window.setInterval(async () => {
      // Pas de requêtes empilées si le serveur est lent, ni d'appel quand l'onglet est caché
      if (busy || document.hidden) return;
      busy = true;
      try {
        const data = await messagesApi.show(activeId, lastId.current || undefined);
        setOtherReadId(data.other_read_id);
        if (data.messages.length) {
          lastId.current = data.messages[data.messages.length - 1].id;
          setMessages((prev) => [...prev, ...data.messages.filter((m) => !prev.some((p) => p.id === m.id))]);
          void refreshUnread();
        }
      } catch {
        /* réessai au prochain cycle */
      } finally {
        busy = false;
      }
    }, THREAD_POLL_MS);
    return () => window.clearInterval(id);
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activeId]);

  async function send() {
    const body = draft.trim();
    if (!body || !activeId) return;
    setSending(true);
    try {
      const message = await messagesApi.send(activeId, body);
      setDraft("");
      lastId.current = message.id;
      setMessages((prev) => [...prev, message]);
      setConversations((list) => {
        const updated = list?.map((c) => (c.id === activeId ? { ...c, last_message: { body, user_id: user!.id, created_at: message.created_at } } : c)) ?? [];
        return [...updated].sort((a, b) => (b.last_message?.created_at ?? "").localeCompare(a.last_message?.created_at ?? ""));
      });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSending(false);
    }
  }

  async function openPicker() {
    setPicking(true);
    setSearch("");
    try {
      setContacts(await messagesApi.contacts());
    } catch (e) {
      toast.error(errMsg(e));
      setContacts([]);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (contacts ?? []).filter((c) => !q || `${c.first_name} ${c.last_name} ${c.organization ?? ""}`.toLowerCase().includes(q));
  }, [contacts, search]);

  const myLastId = [...messages].reverse().find((m) => m.user_id === user?.id)?.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
        action={
          <button className={btnPrimary} onClick={openPicker}>
            <MessageSquarePlus className="h-4 w-4" />
            {t("messages.new")}
          </button>
        }
      />

      <div className={`${cardCls} grid h-[calc(100vh-240px)] min-h-[480px] overflow-hidden md:grid-cols-[320px_1fr]`}>
        {/* Conversations */}
        <aside className={`flex min-h-0 flex-col border-white/[0.06] md:border-e ${activeId ? "hidden md:flex" : "flex"}`}>
          <div className="border-b border-white/[0.06] px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            {t("messages.conversations")}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations === null ? (
              <p className="p-6 text-center text-sm text-slate-500">{t("common.loading")}</p>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <MessagesSquare className="h-9 w-9 text-slate-600" />
                <p className="text-sm text-slate-400">{t("messages.empty")}</p>
                <button className="text-sm text-cyan-300 hover:underline" onClick={openPicker}>
                  {t("messages.new")}
                </button>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-start transition ${
                    activeId === c.id ? "bg-gradient-to-r from-cyan-400/10 to-violet-500/5" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <Avatar person={c.other} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${c.unread ? "font-semibold text-white" : "text-slate-200"}`}>
                        {c.other ? `${c.other.first_name} ${c.other.last_name}` : "—"}
                      </span>
                      {c.last_message && <span className="shrink-0 text-[10px] text-slate-500">{formatRelative(c.last_message.created_at)}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-xs ${c.unread ? "text-slate-200" : "text-slate-500"}`}>
                        {c.last_message?.user_id === user?.id ? `${t("messages.you")} : ` : ""}
                        {c.last_message?.body}
                      </span>
                      {c.unread > 0 && (
                        <span className="ms-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Fil de discussion */}
        <section className={`min-h-0 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-200">
                <MessagesSquare className="h-8 w-8" />
              </span>
              <p className="text-sm text-slate-400">{t("messages.pick")}</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <button type="button" className="md:hidden" onClick={() => setActiveId(null)} aria-label={t("common.back")}>
                  <ArrowLeft className="h-5 w-5 text-slate-400 rtl:rotate-180" />
                </button>
                <Avatar person={other} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{other ? `${other.first_name} ${other.last_name}` : "…"}</p>
                  <p className="truncate text-xs text-cyan-300/80">{subtitle(other)}</p>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500">{t("messages.startHint")}</p>}
                {messages.map((m, i) => {
                  const mine = m.user_id === user?.id;
                  const day = m.created_at.slice(0, 10);
                  const newDay = i === 0 || messages[i - 1].created_at.slice(0, 10) !== day;
                  return (
                    <Fragment key={m.id}>
                      {newDay && (
                        <div className="my-3 text-center text-[11px] text-slate-500">
                          <span className="rounded-full bg-white/[0.04] px-3 py-1">{formatDate(m.created_at)}</span>
                        </div>
                      )}
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                            mine
                              ? "rounded-ee-sm bg-gradient-to-br from-cyan-500/30 to-violet-500/25 text-white"
                              : "rounded-es-sm border border-white/[0.08] bg-white/[0.04] text-slate-100"
                          }`}
                        >
                          <p className="whitespace-pre-line break-words">{m.body}</p>
                          <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-cyan-100/60" : "text-slate-500"}`}>
                            {formatTime(m.created_at)}
                            {mine && m.id === myLastId && otherReadId !== null && otherReadId >= m.id && (
                              <span className="flex items-center gap-0.5 text-cyan-200">
                                <CheckCheck className="h-3 w-3" /> {t("messages.seen")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="border-t border-white/[0.06] p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder={t("messages.placeholder")}
                    className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                  />
                  <button type="button" className={`${btnPrimary} h-11`} onClick={send} disabled={sending || !draft.trim()} aria-label={t("tickets.send")}>
                    <Send className="h-4 w-4 rtl:rotate-180" />
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">{t("messages.enterHint")}</p>
              </div>
            </>
          )}
        </section>
      </div>

      {picking && (
        <Modal title={t("messages.new")} onClose={() => setPicking(false)}>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("messages.search")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] ps-10 pe-4 text-sm text-white outline-none focus:border-cyan-400/40"
              />
            </div>
            <p className="text-xs text-slate-500">{t(`messages.who.${user?.role ?? "membre_equipe"}`)}</p>
            <div className="max-h-[50vh] space-y-1 overflow-y-auto">
              {contacts === null ? (
                <p className="py-6 text-center text-sm text-slate-500">{t("common.loading")}</p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">{t("messages.noContact")}</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => startWith(c.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition hover:bg-white/[0.05]"
                  >
                    <Avatar person={c} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{subtitle(c)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
