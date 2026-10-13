import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ArrowLeft, CheckCircle2, Circle, CircleDot, Clock, GitPullRequestArrow, MessagesSquare, Send, XCircle } from "lucide-react";
import { clientApi, type ChangeRequestPriority, type ClientProjectDetail, type ClientSchedule } from "../../services/clientApi";
import { Field, Modal, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";
import { SkeletonCards } from "../../components/ui-nexus/Skeleton";
import Avatar from "../../components/ui-nexus/Avatar";
import { ChangePriority, ChangeStatusBadge } from "../../components/common/ChangeRequestBadge";
import { formatDate, formatRelative } from "../../i18n/format";
import { toast } from "../../lib/toast";

const SCHEDULE_CLS: Record<ClientSchedule, string> = {
  on_track: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  watch: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  late: "border-red-400/30 bg-red-500/10 text-red-200",
  done: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
};

const TASK_ICON = {
  todo: { Icon: Circle, cls: "text-slate-500" },
  in_progress: { Icon: CircleDot, cls: "text-violet-300" },
  review: { Icon: CircleDot, cls: "text-amber-300" },
  done: { Icon: CheckCircle2, cls: "text-emerald-400" },
};

const chartBase: ApexOptions = {
  chart: { toolbar: { show: false }, background: "transparent", fontFamily: "inherit", zoom: { enabled: false } },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  tooltip: { theme: "dark" },
  dataLabels: { enabled: false },
};

/* Suivi détaillé d'un projet pour le client : évolution, étapes, historique, demandes de changement. */
export default function ClientProjectDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ClientProjectDetail | null>(null);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState<{ title: string; description: string; priority: ChangeRequestPriority }>({
    title: "",
    description: "",
    priority: "normal",
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await clientApi.project(Number(id)));
    } catch (e) {
      toast.error(errMsg(e));
      navigate("/dashboard/client", { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitChange() {
    if (!draft.title.trim() || !draft.description.trim()) {
      toast.error(t("support.required"));
      return;
    }
    setBusy(true);
    try {
      await clientApi.requestChange(Number(id), draft);
      toast.success(t("changes.sent"));
      setAsking(false);
      setDraft({ title: "", description: "", priority: "normal" });
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <SkeletonCards count={3} />;
  const { project } = data;
  const done = data.tasks.filter((x) => x.status === "done").length;

  return (
    <div className="space-y-6">
      <Link to="/dashboard/client" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("client.nav.projects")}
      </Link>

      {/* En-tête */}
      <div className={`${cardCls} relative overflow-hidden p-6`}>
        <div className="pointer-events-none absolute -end-20 -top-20 h-60 w-60 rounded-full bg-gradient-to-br from-cyan-500/15 to-violet-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${SCHEDULE_CLS[project.schedule]}`}>
                {t(`client.schedule.${project.schedule}`)}
              </span>
            </div>
            {project.description && <p className="max-w-3xl text-sm text-slate-400">{project.description}</p>}
            <p className="flex flex-wrap gap-4 text-xs text-slate-400">
              {project.start_date && <span>{t("client.projects.start")} : {formatDate(project.start_date)}</span>}
              {project.deadline && <span>{t("client.projects.deadline")} : {formatDate(project.deadline)}</span>}
              <span>{t("client.detail.tasksDone", { done, total: data.tasks.length })}</span>
            </p>
          </div>
          <div className="text-end">
            <p className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-5xl font-bold text-transparent">{project.progress}%</p>
            <p className="text-xs text-slate-500">{t("client.projects.avgProgress")}</p>
          </div>
        </div>
        <div className="relative mt-5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 transition-all" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
          {project.chef && (
            <div className="flex items-center gap-3">
              <Avatar person={project.chef} size="md" />
              <div>
                <p className="text-sm text-white">
                  {project.chef.first_name} {project.chef.last_name}
                </p>
                <p className="text-xs text-slate-500">{t("client.detail.yourContact")}</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {project.chef && (
              <button className={btnGhost} onClick={() => navigate(`/dashboard/client/messages?with=${project.chef!.id}`)}>
                <MessagesSquare className="h-4 w-4" />
                {t("client.detail.writeChef")}
              </button>
            )}
            <button className={btnPrimary} onClick={() => setAsking(true)}>
              <GitPullRequestArrow className="h-4 w-4" />
              {t("changes.new")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Courbe d'évolution */}
        <div className={`${cardCls} p-5 xl:col-span-2`}>
          <p className="text-sm font-semibold text-white">{t("client.detail.evolution")}</p>
          <p className="mb-2 text-xs text-slate-500">{t("client.detail.evolutionHint")}</p>
          <Chart
            type="area"
            height={290}
            series={[
              { name: t("client.detail.planned"), data: data.evolution.map((p) => p.planned) },
              { name: t("client.detail.actual"), data: data.evolution.map((p) => p.actual) },
            ]}
            options={{
              ...chartBase,
              colors: ["#64748b", "#22d3ee"],
              stroke: { width: [2, 3], dashArray: [6, 0], curve: "smooth" },
              fill: { type: ["solid", "gradient"], opacity: [0, 0.35], gradient: { shadeIntensity: 0, opacityFrom: 0.45, opacityTo: 0.02 } },
              xaxis: { categories: data.evolution.map((p) => formatDate(p.date, { day: "2-digit", month: "2-digit" })) },
              yaxis: { min: 0, max: 100, labels: { formatter: (v) => `${Math.round(v)} %` } },
              legend: { position: "top" },
            }}
          />
        </div>

        {/* Historique */}
        <div className={`${cardCls} p-5`}>
          <p className="mb-3 text-sm font-semibold text-white">{t("client.detail.timeline")}</p>
          {data.timeline.length === 0 ? (
            <p className="text-xs text-slate-500">{t("client.projects.noneYet")}</p>
          ) : (
            <ol className="relative space-y-4 border-s border-white/10 ps-5">
              {data.timeline.map((item, i) => {
                const rejected = item.type === "change_rejected";
                const Icon = item.type === "task_done" ? CheckCircle2 : rejected ? XCircle : GitPullRequestArrow;
                return (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -start-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A1424] ${
                        item.type === "task_done" ? "text-emerald-400" : rejected ? "text-red-400" : "text-violet-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm text-slate-200">{item.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {t(`client.detail.event.${item.type}`)} · {formatRelative(item.date)}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Étapes du projet */}
        <div className={`${cardCls} p-5`}>
          <p className="mb-3 text-sm font-semibold text-white">{t("client.detail.steps")}</p>
          {data.tasks.length === 0 ? (
            <p className="text-xs text-slate-500">{t("client.projects.noneYet")}</p>
          ) : (
            <ul className="max-h-[380px] space-y-1 overflow-y-auto pe-1">
              {data.tasks.map((task) => {
                const { Icon, cls } = TASK_ICON[task.status];
                return (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
                    <Icon className={`h-4 w-4 shrink-0 ${cls}`} />
                    <span className={`min-w-0 flex-1 truncate text-sm ${task.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>
                      {task.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-500">{t(`chef.tasks.status.${task.status}`)}</span>
                    {task.due_date && task.status !== "done" && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(task.due_date, { day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Demandes de changement */}
        <div className={`${cardCls} p-5`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{t("changes.title")}</p>
            <button className="text-sm text-cyan-300 hover:underline" onClick={() => setAsking(true)}>
              + {t("changes.new")}
            </button>
          </div>
          {data.change_requests.length === 0 ? (
            <p className="text-xs text-slate-500">{t("changes.emptyClient")}</p>
          ) : (
            <ul className="space-y-3">
              {data.change_requests.map((c) => (
                <li key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{c.title}</p>
                    <ChangeStatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{c.description}</p>
                  <p className="mt-1 flex gap-3 text-[11px] text-slate-500">
                    <ChangePriority priority={c.priority} />
                    {formatRelative(c.created_at)}
                  </p>
                  {c.response && (
                    <p className="mt-2 rounded-lg border-s-2 border-cyan-400/50 bg-cyan-400/[0.05] px-3 py-2 text-xs text-slate-200">
                      <span className="font-medium text-cyan-200">
                        {c.responder ? `${c.responder.first_name} ${c.responder.last_name}` : t("changes.chef")} :
                      </span>{" "}
                      {c.response}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {asking && (
        <Modal title={t("changes.new")} onClose={() => setAsking(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{t("changes.hint")}</p>
            <Field label={t("changes.fields.title")}>
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={t("changes.fields.description")}>
              <textarea
                rows={5}
                className={inputCls}
                placeholder={t("changes.fields.descriptionPlaceholder")}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label={t("changes.fields.priority")}>
              <div className="flex gap-2">
                {(["low", "normal", "high"] as ChangeRequestPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDraft({ ...draft, priority: p })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${
                      draft.priority === p ? "border-cyan-400/40 bg-cyan-400/10 text-white" : "border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t(`changes.priority.${p}`)}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setAsking(false)}>
                {t("common.cancel")}
              </button>
              <button className={btnPrimary} onClick={submitChange} disabled={busy}>
                <Send className="h-4 w-4 rtl:rotate-180" />
                {busy ? t("common.saving") : t("changes.send")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
