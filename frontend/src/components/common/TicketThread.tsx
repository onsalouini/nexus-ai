import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Sparkles } from "lucide-react";
import type { Ticket } from "../../services/workspaceApi";
import Avatar from "../ui-nexus/Avatar";
import { btnPrimary, errMsg, inputCls } from "../ui-nexus/kit";
import { formatRelative } from "../../i18n/format";
import { roleLabel } from "../../i18n/labels";
import { toast } from "../../lib/toast";

/*
| Fil de discussion d'un ticket, partagé entre l'espace client et la file support.
| Le message d'origine du ticket est affiché en premier.
*/
export default function TicketThread({
  ticket,
  currentUserId,
  onSend,
  onSuggest,
  readOnlyHint,
}: {
  ticket: Ticket;
  currentUserId?: number;
  onSend: (body: string) => Promise<void>;
  onSuggest?: () => Promise<string>;
  readOnlyHint?: string;
}) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [ticket.messages?.length]);

  const opening = {
    id: 0,
    body: ticket.description,
    created_at: ticket.created_at,
    user_id: ticket.created_by ?? null,
    author: ticket.creator ?? { id: 0, first_name: ticket.customer_name || t("support.anonymous"), last_name: "", role: "client" },
  };
  const messages = [opening, ...(ticket.messages ?? [])];

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await onSend(body.trim());
      setBody("");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSending(false);
    }
  }

  async function suggest() {
    if (!onSuggest) return;
    setSuggesting(true);
    try {
      setBody(await onSuggest());
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[360px] space-y-3 overflow-y-auto pe-1">
        {messages.map((m) => {
          const mine = currentUserId !== undefined && m.user_id === currentUserId;
          const isClient = m.author?.role === "client" || m.id === 0;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar person={m.author} size="sm" />
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                mine
                  ? "rounded-ee-sm bg-gradient-to-br from-cyan-500/25 to-violet-500/20 text-white"
                  : isClient
                    ? "rounded-es-sm border border-amber-400/15 bg-amber-400/[0.06] text-slate-100"
                    : "rounded-es-sm border border-white/[0.08] bg-white/[0.04] text-slate-100"
              }`}>
                <p className="mb-1 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-200">
                    {m.author ? `${m.author.first_name} ${m.author.last_name}`.trim() : t("support.anonymous")}
                  </span>
                  {m.author?.role && <> · {roleLabel(m.author.role)}</>} · {formatRelative(m.created_at)}
                </p>
                <p className="whitespace-pre-line text-sm leading-6">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {readOnlyHint ? (
        <p className="rounded-xl bg-white/[0.03] px-4 py-3 text-center text-xs text-slate-400">{readOnlyHint}</p>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={3}
            className={inputCls}
            placeholder={t("tickets.replyPlaceholder")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void send();
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {onSuggest ? (
              <button
                type="button"
                onClick={suggest}
                disabled={suggesting}
                className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-100 transition hover:bg-violet-500/20 disabled:opacity-60"
              >
                <Sparkles className={`h-4 w-4 ${suggesting ? "animate-spin" : ""}`} />
                {suggesting ? t("tickets.suggesting") : t("tickets.suggest")}
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">{t("tickets.ctrlEnter")}</span>
            )}
            <button type="button" className={btnPrimary} onClick={send} disabled={sending || !body.trim()}>
              <Send className="h-4 w-4 rtl:rotate-180" />
              {sending ? t("common.saving") : t("tickets.send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
