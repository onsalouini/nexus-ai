import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Frown, Meh, Smile, Sparkles, UserPlus } from "lucide-react";
import {
  workspaceApi,
  type Ticket,
  type TicketCategory,
  type TicketSentiment,
  type TicketStats,
  type TicketStatus,
  type TicketUrgency,
} from "../../services/workspaceApi";
import { useAuth } from "../../context/AuthContext";
import { Field, Modal, PageHeader, Stat, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";
import { SkeletonRows } from "../../components/ui-nexus/Skeleton";
import { formatRelative } from "../../i18n/format";
import { toast } from "../../lib/toast";

const CATEGORIES: TicketCategory[] = ["bug", "billing", "feature", "account", "other"];
const URGENCIES: TicketUrgency[] = ["critical", "high", "medium", "low"];
const SENTIMENTS: TicketSentiment[] = ["negative", "neutral", "positive"];
const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

const URGENCY_CLS: Record<TicketUrgency, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-300",
  high: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  medium: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  low: "border-white/10 bg-white/[0.04] text-slate-300",
};

const SENTIMENT_ICON = { negative: Frown, neutral: Meh, positive: Smile };
const SENTIMENT_CLS = { negative: "text-red-300", neutral: "text-slate-400", positive: "text-emerald-300" };

type Filter = "queue" | "mine" | "resolved";

export default function TicketsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("queue");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", customer_name: "", customer_email: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await workspaceApi.tickets(
        filter === "mine" ? { mine: true } : filter === "resolved" ? { status: "resolved" } : undefined
      );
      setTickets(data.tickets);
      setStats(data.stats);
    } catch (e) {
      toast.error(errMsg(e, t("support.loadError")));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function update(ticket: Ticket, patch: Parameters<typeof workspaceApi.updateTicket>[1], success?: string) {
    try {
      const updated = await workspaceApi.updateTicket(ticket.id, patch);
      setSelected((current) => (current?.id === updated.id ? updated : current));
      if (success) toast.success(success);
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function create() {
    if (!draft.title.trim() || !draft.description.trim()) {
      toast.error(t("support.required"));
      return;
    }
    setBusy(true);
    try {
      const ticket = await workspaceApi.createTicket({
        title: draft.title,
        description: draft.description,
        customer_name: draft.customer_name || undefined,
        customer_email: draft.customer_email || undefined,
      });
      toast.success(
        t("support.created", {
          urgency: t(`support.urgency.${ticket.urgency}`),
          category: t(`support.category.${ticket.category}`),
        })
      );
      setCreating(false);
      setDraft({ title: "", description: "", customer_name: "", customer_email: "" });
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("support.title")}
        subtitle={t("support.subtitle")}
        action={
          <button className={btnPrimary} onClick={() => setCreating(true)}>
            + {t("support.new")}
          </button>
        }
      />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat tone="sky" label={t("support.stats.open")} value={stats.open} />
          <Stat tone="violet" label={t("support.stats.inProgress")} value={stats.in_progress} />
          <Stat tone="rose" label={t("support.stats.critical")} value={<span className={stats.critical_open ? "text-red-400" : ""}>{stats.critical_open}</span>} />
          <Stat tone="emerald" label={t("support.stats.resolved")} value={stats.resolved} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["queue", "mine", "resolved"] as Filter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              filter === key ? "border-cyan-400/40 bg-cyan-400/10 text-white" : "border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            {t(`support.filters.${key}`)}
            {key === "mine" && stats ? ` (${stats.mine})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : tickets.length === 0 ? (
        <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("support.empty")}</div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const SentimentIcon = SENTIMENT_ICON[ticket.sentiment];
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelected(ticket)}
                className={`${cardCls} flex w-full flex-wrap items-center gap-3 p-4 text-start transition hover:border-cyan-400/25`}
              >
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${URGENCY_CLS[ticket.urgency]}`}>
                  {t(`support.urgency.${ticket.urgency}`)}
                </span>
                <SentimentIcon className={`h-4 w-4 ${SENTIMENT_CLS[ticket.sentiment]}`} aria-label={t(`support.sentiment.${ticket.sentiment}`)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    #{ticket.id} · {ticket.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {t(`support.category.${ticket.category}`)} · {ticket.customer_name || ticket.customer_email || t("support.anonymous")} ·{" "}
                    {formatRelative(ticket.created_at)}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : t("support.unassigned")}
                </span>
                <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-xs text-slate-300">{t(`support.status.${ticket.status}`)}</span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <Modal title={`#${selected.id} · ${selected.title}`} onClose={() => setSelected(null)} wide>
          <div className="space-y-5">
            <p className="whitespace-pre-line rounded-xl bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">{selected.description}</p>
            <p className="text-xs text-slate-500">
              {selected.customer_name || t("support.anonymous")}
              {selected.customer_email && <span dir="ltr"> · {selected.customer_email}</span>} · {formatRelative(selected.created_at)}
            </p>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                {t("support.classification")}
                {selected.classification_corrected && (
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] normal-case text-violet-200">
                    {t("support.corrected")}
                  </span>
                )}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t("support.fields.category")}>
                  <select className={inputCls} value={selected.category} onChange={(e) => update(selected, { category: e.target.value as TicketCategory })}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{t(`support.category.${c}`)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t("support.fields.urgency")}>
                  <select className={inputCls} value={selected.urgency} onChange={(e) => update(selected, { urgency: e.target.value as TicketUrgency })}>
                    {URGENCIES.map((u) => (
                      <option key={u} value={u}>{t(`support.urgency.${u}`)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t("support.fields.sentiment")}>
                  <select className={inputCls} value={selected.sentiment} onChange={(e) => update(selected, { sentiment: e.target.value as TicketSentiment })}>
                    {SENTIMENTS.map((s) => (
                      <option key={s} value={s}>{t(`support.sentiment.${s}`)}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="mt-2 text-xs text-slate-500">{t("support.correctionHint")}</p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <Field label={t("support.fields.status")}>
                <select className={inputCls} value={selected.status} onChange={(e) => update(selected, { status: e.target.value as TicketStatus }, t("support.statusSaved"))}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`support.status.${s}`)}</option>
                  ))}
                </select>
              </Field>
              {selected.assigned_to !== user?.id && (
                <button
                  className={btnGhost}
                  onClick={() =>
                    update(
                      selected,
                      { assigned_to: user?.id, status: selected.status === "open" ? "in_progress" : selected.status },
                      t("support.taken")
                    )
                  }
                >
                  <UserPlus className="h-4 w-4" />
                  {t("support.take")}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {creating && (
        <Modal title={t("support.new")} onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <Field label={t("support.fields.title")}>
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={t("support.fields.description")}>
              <textarea rows={5} className={inputCls} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("support.fields.customerName")}>
                <input className={inputCls} value={draft.customer_name} onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })} />
              </Field>
              <Field label={t("support.fields.customerEmail")}>
                <input type="email" dir="ltr" className={inputCls} value={draft.customer_email} onChange={(e) => setDraft({ ...draft, customer_email: e.target.value })} />
              </Field>
            </div>
            <p className="text-xs text-slate-500">{t("support.autoTriage")}</p>
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setCreating(false)}>{t("common.cancel")}</button>
              <button className={btnPrimary} onClick={create} disabled={busy}>
                {busy ? t("common.saving") : t("common.create")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
