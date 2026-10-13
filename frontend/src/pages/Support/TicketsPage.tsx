import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrainCircuit, Frown, Meh, MessageSquare, RefreshCw, Smile, Sparkles, UserPlus } from "lucide-react";
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
import TicketThread from "../../components/common/TicketThread";
import Avatar from "../../components/ui-nexus/Avatar";
import type { TicketModelStatus } from "../../services/workspaceApi";

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

/* Origine du tri automatique : modèle ML maison (avec confiance), Groq ou mots-clés */
function TriageBadge({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  if (!ticket.triage_source) return null;
  const confidence = ticket.triage_confidence?.urgency ?? ticket.triage_confidence?.category;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        ticket.triage_source === "ml"
          ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
          : "border-white/10 bg-white/[0.04] text-slate-400"
      }`}
      title={t("support.triage.title")}
    >
      <BrainCircuit className="h-3 w-3" />
      {t(`support.triage.${ticket.triage_source}`)}
      {confidence !== undefined && ` · ${Math.round(confidence * 100)} %`}
    </span>
  );
}

/* Direction : état du modèle de tri et ré-entraînement avec les corrections des agents */
function ModelCard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TicketModelStatus | null>(null);
  const [training, setTraining] = useState(false);

  const load = useCallback(() => {
    workspaceApi.ticketModel().then(setStatus).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  async function retrain() {
    setTraining(true);
    try {
      const r = await workspaceApi.retrainTicketModel();
      toast.success(t("support.model.retrained", { n: r.samples }));
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setTraining(false);
    }
  }

  if (!status) return null;
  const metrics = status.model?.metrics.handwritten;
  return (
    <div className={`${cardCls} flex flex-wrap items-center gap-5 p-5`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-violet-100">
        <BrainCircuit className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{t("support.model.title")}</p>
        <p className="text-xs text-slate-400">
          {status.model
            ? t("support.model.version", { version: status.model.version, samples: status.model.n_samples, feedback: status.model.n_feedback })
            : t("support.model.offline")}
        </p>
      </div>
      {metrics && (
        <div className="flex gap-2">
          {(["category", "urgency", "sentiment"] as const).map((k) =>
            metrics[k] ? (
              <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-center">
                <p className="text-sm font-semibold text-white">{Math.round(metrics[k]!.accuracy * 100)} %</p>
                <p className="text-[10px] text-slate-500">{t(`support.fields.${k}`)}</p>
              </div>
            ) : null
          )}
        </div>
      )}
      <button type="button" className={btnGhost} onClick={retrain} disabled={training || !status.model}>
        <RefreshCw className={`h-4 w-4 ${training ? "animate-spin" : ""}`} />
        {training ? t("support.model.training") : t("support.model.retrain", { n: status.corrections })}
      </button>
    </div>
  );
}

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

  async function openTicket(ticket: Ticket) {
    setSelected(ticket);
    try {
      setSelected(await workspaceApi.ticket(ticket.id));
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function reply(body: string) {
    if (!selected) return;
    setSelected(await workspaceApi.replyTicket(selected.id, body));
    toast.success(t("tickets.sent"));
    void load();
  }

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

      {user?.role === "direction" && <ModelCard />}

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
                onClick={() => openTicket(ticket)}
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
                    {ticket.project ? `${ticket.project.name} · ` : ""}
                    {t(`support.category.${ticket.category}`)} · {ticket.customer_name || ticket.customer_email || t("support.anonymous")} ·{" "}
                    {formatRelative(ticket.created_at)}
                  </p>
                </div>
                <TriageBadge ticket={ticket} />
                {!!ticket.messages_count && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {ticket.messages_count}
                  </span>
                )}
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  {ticket.assignee && <Avatar person={ticket.assignee} size="xs" />}
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
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                {selected.customer_name || t("support.anonymous")}
                {selected.customer_email && <span dir="ltr"> · {selected.customer_email}</span>}
              </span>
              {selected.project && (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 text-cyan-200">{selected.project.name}</span>
              )}
              <TriageBadge ticket={selected} />
            </div>

            <TicketThread
              ticket={selected}
              currentUserId={user?.id}
              onSend={reply}
              onSuggest={() => workspaceApi.suggestReply(selected.id)}
            />

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
