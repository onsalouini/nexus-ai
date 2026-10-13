import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, LifeBuoy, MessageSquare, Sparkles } from "lucide-react";
import { clientApi, type ClientProject } from "../../services/clientApi";
import type { Ticket, TicketStatus } from "../../services/workspaceApi";
import { useAuth } from "../../context/AuthContext";
import { Field, Modal, PageHeader, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";
import { SkeletonRows } from "../../components/ui-nexus/Skeleton";
import TicketThread from "../../components/common/TicketThread";
import { formatRelative } from "../../i18n/format";
import { toast } from "../../lib/toast";

const STATUS_CLS: Record<TicketStatus, string> = {
  open: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  in_progress: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  resolved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  closed: "border-white/10 bg-white/[0.04] text-slate-300",
};

export default function ClientTicketsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", project_id: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTickets(await clientApi.tickets());
    } catch (e) {
      toast.error(errMsg(e));
      setTickets([]);
    }
  }, []);

  useEffect(() => {
    void load();
    clientApi.projects().then(setProjects).catch(() => undefined);
  }, [load]);

  // Liens profonds : ?new=1&project=3 (depuis un projet) ou ?open=12 (depuis une notification)
  useEffect(() => {
    if (params.get("new")) {
      setDraft((d) => ({ ...d, project_id: params.get("project") ?? "" }));
      setCreating(true);
    }
    const open = Number(params.get("open"));
    if (open) clientApi.ticket(open).then(setSelected).catch(() => undefined);
    if (params.get("new") || open) setParams({}, { replace: true });
  }, [params, setParams]);

  async function openTicket(ticket: Ticket) {
    setSelected(ticket);
    try {
      setSelected(await clientApi.ticket(ticket.id));
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
      const ticket = await clientApi.createTicket({
        title: draft.title,
        description: draft.description,
        project_id: draft.project_id ? Number(draft.project_id) : null,
      });
      toast.success(t("client.tickets.created"));
      setCreating(false);
      setDraft({ title: "", description: "", project_id: "" });
      await load();
      setSelected(ticket);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function reply(body: string) {
    if (!selected) return;
    setSelected(await clientApi.reply(selected.id, body));
    void load();
  }

  async function close() {
    if (!selected) return;
    try {
      setSelected(await clientApi.close(selected.id));
      toast.success(t("client.tickets.closed"));
      void load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  const open = tickets?.filter((x) => x.status === "open" || x.status === "in_progress").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("client.tickets.title")}
        subtitle={t("client.tickets.subtitle")}
        action={
          <button className={btnPrimary} onClick={() => setCreating(true)}>
            + {t("client.tickets.new")}
          </button>
        }
      />

      <div className={`${cardCls} flex flex-wrap items-center gap-4 p-5`}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/20 text-violet-200">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-slate-300">{t("client.tickets.aiHint")}</p>
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
          {t("client.tickets.openCount", { n: open })}
        </span>
      </div>

      {tickets === null ? (
        <SkeletonRows count={4} />
      ) : tickets.length === 0 ? (
        <div className={`${cardCls} flex flex-col items-center gap-3 p-12 text-center`}>
          <LifeBuoy className="h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">{t("client.tickets.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => openTicket(ticket)}
              className={`${cardCls} flex w-full flex-wrap items-center gap-3 p-4 text-start transition hover:border-cyan-400/25`}
            >
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLS[ticket.status]}`}>
                {t(`support.status.${ticket.status}`)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  #{ticket.id} · {ticket.title}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {ticket.project?.name ? `${ticket.project.name} · ` : ""}
                  {t(`support.category.${ticket.category}`)} · {formatRelative(ticket.created_at)}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" />
                {ticket.messages_count ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`#${selected.id} · ${selected.title}`} onClose={() => setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full border px-2.5 py-1 font-semibold ${STATUS_CLS[selected.status]}`}>
                {t(`support.status.${selected.status}`)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">
                {t(`support.category.${selected.category}`)}
              </span>
              {selected.project && (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1 text-cyan-200">{selected.project.name}</span>
              )}
              {selected.assignee && (
                <span className="text-slate-400">
                  {t("client.tickets.handledBy", { name: `${selected.assignee.first_name} ${selected.assignee.last_name}` })}
                </span>
              )}
            </div>

            <TicketThread
              ticket={selected}
              currentUserId={user?.id}
              onSend={reply}
              readOnlyHint={selected.status === "closed" ? t("client.tickets.closedHint") : undefined}
            />

            {selected.status !== "closed" && (
              <div className="flex justify-end border-t border-white/[0.06] pt-4">
                <button type="button" className={btnGhost} onClick={close}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {t("client.tickets.solved")}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {creating && (
        <Modal title={t("client.tickets.new")} onClose={() => setCreating(false)}>
          <div className="space-y-4">
            {projects.length > 0 && (
              <Field label={t("client.tickets.project")}>
                <select className={inputCls} value={draft.project_id} onChange={(e) => setDraft({ ...draft, project_id: e.target.value })}>
                  <option value="">{t("client.tickets.noProject")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={t("support.fields.title")}>
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={t("support.fields.description")}>
              <textarea
                rows={6}
                className={inputCls}
                placeholder={t("client.tickets.descriptionPlaceholder")}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <p className="text-xs text-slate-500">{t("client.tickets.aiHint")}</p>
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setCreating(false)}>
                {t("common.cancel")}
              </button>
              <button className={btnPrimary} onClick={create} disabled={busy}>
                {busy ? t("common.saving") : t("client.tickets.send")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
