import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { GitPullRequestArrow, MessagesSquare } from "lucide-react";
import { api } from "../../lib/api";
import type { ChangeRequest, ChangeRequestStatus } from "../../services/clientApi";
import { Field, Modal, PageHeader, Stat, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";
import { SkeletonRows } from "../../components/ui-nexus/Skeleton";
import Avatar from "../../components/ui-nexus/Avatar";
import { ChangePriority, ChangeStatusBadge } from "../../components/common/ChangeRequestBadge";
import { formatRelative } from "../../i18n/format";
import { toast } from "../../lib/toast";

const STATUSES: ChangeRequestStatus[] = ["pending", "accepted", "in_progress", "done", "rejected"];
type Filter = "open" | "all";

/* Chef de projet : demandes de changement envoyées par ses clients */
export default function ChangeRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChangeRequest[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [answer, setAnswer] = useState<{ status: ChangeRequestStatus; response: string }>({ status: "accepted", response: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await api.get<{ requests: ChangeRequest[] }>("/chef/change-requests")).data.requests);
    } catch (e) {
      toast.error(errMsg(e));
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openItem(c: ChangeRequest) {
    setSelected(c);
    setAnswer({ status: c.status === "pending" ? "accepted" : c.status, response: c.response ?? "" });
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/chef/change-requests/${selected.id}`, { status: answer.status, response: answer.response || null });
      toast.success(t("changes.answered"));
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const visible = (items ?? []).filter((c) => filter === "all" || !["done", "rejected"].includes(c.status));
  const count = (s: ChangeRequestStatus) => (items ?? []).filter((c) => c.status === s).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("changes.chefTitle")} subtitle={t("changes.chefSubtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat tone="amber" label={t("changes.status.pending")} value={count("pending")} />
        <Stat tone="cyan" label={t("changes.status.accepted")} value={count("accepted")} />
        <Stat tone="violet" label={t("changes.status.in_progress")} value={count("in_progress")} />
        <Stat tone="emerald" label={t("changes.status.done")} value={count("done")} />
      </div>

      <div className="flex gap-2">
        {(["open", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              filter === f ? "border-cyan-400/40 bg-cyan-400/10 text-white" : "border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            {t(`changes.filters.${f}`)}
          </button>
        ))}
      </div>

      {items === null ? (
        <SkeletonRows count={4} />
      ) : visible.length === 0 ? (
        <div className={`${cardCls} flex flex-col items-center gap-3 p-12 text-center`}>
          <GitPullRequestArrow className="h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">{t("changes.emptyChef")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openItem(c)}
              className={`${cardCls} flex w-full flex-wrap items-center gap-3 p-4 text-start transition hover:border-cyan-400/25`}
            >
              <Avatar person={c.client} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{c.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {c.client ? `${c.client.first_name} ${c.client.last_name}` : "—"}
                  {c.client?.organization ? ` (${c.client.organization})` : ""} · {c.project?.name} · {formatRelative(c.created_at)}
                </p>
              </div>
              <ChangePriority priority={c.priority} />
              <ChangeStatusBadge status={c.status} />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Avatar person={selected.client} size="sm" />
              <span className="text-slate-300">
                {selected.client?.first_name} {selected.client?.last_name}
                {selected.client?.organization ? ` · ${selected.client.organization}` : ""}
              </span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 text-xs text-cyan-200">{selected.project?.name}</span>
              <ChangePriority priority={selected.priority} />
            </div>
            <p className="whitespace-pre-line rounded-xl bg-white/[0.03] p-4 text-sm leading-6 text-slate-200">{selected.description}</p>

            <Field label={t("changes.decision")}>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== "pending").map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAnswer({ ...answer, status: s })}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      answer.status === s ? "border-cyan-400/40 bg-cyan-400/10 text-white" : "border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t(`changes.status.${s}`)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("changes.response")}>
              <textarea
                rows={4}
                className={inputCls}
                placeholder={t("changes.responsePlaceholder")}
                value={answer.response}
                onChange={(e) => setAnswer({ ...answer, response: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap justify-between gap-2">
              {selected.client && (
                <button className={btnGhost} onClick={() => navigate(`/dashboard/chef/messages?with=${selected.client!.id}`)}>
                  <MessagesSquare className="h-4 w-4" />
                  {t("changes.writeClient")}
                </button>
              )}
              <button className={btnPrimary} onClick={save} disabled={busy}>
                {busy ? t("common.saving") : t("changes.sendAnswer")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
