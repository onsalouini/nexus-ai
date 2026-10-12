import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { chefApi, type Member, type Overview, type Team, type Tracking } from "../../services/chefApi";
import {
  Field,
  PageHeader,
  ProgressBar,
  PROJECT_STATUSES,
  statusLabel,
  Stat,
  btnGhost,
  btnPrimary,
  btnDanger,
  cardCls,
  errMsg,
  inputCls,
} from "../../components/ui-nexus/kit";
import { formatDate, formatDateTime, formatTime } from "../../i18n/format";
import { healthLabel, riskLabel } from "../../i18n/labels";

const base: ApexOptions = {
  chart: { toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  tooltip: { theme: "dark" },
};

const healthColor = (s: number) => (s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : s >= 40 ? "#fb923c" : "#f87171");

export default function TrackingPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [data, setData] = useState<Tracking | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [addId, setAddId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = useCallback(async (pid: number | null) => {
    try {
      const [ov, m, t] = await Promise.all([chefApi.overview(), chefApi.members(), chefApi.teams()]);
      setOverview(ov);
      setMembers(m);
      setTeams(t);
      const target = pid ?? ov.projects[0]?.id ?? null;
      if (target !== pid) setSelected(target);
      if (target) setData(await chefApi.tracking(target));
      else setData(null);
      setLastSync(new Date());
      setError(null);
    } catch (e) {
      setError(errMsg(e, t("chef.trackingPage.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh(selected);
    // Mise à jour automatique toutes les 20 s (statut/avancement toujours à jour)
    const id = window.setInterval(() => refresh(selected), 20000);
    return () => window.clearInterval(id);
  }, [selected, refresh]);

  async function addMember() {
    if (!selected || !addId) return;
    try {
      await chefApi.addProjectMember(selected, Number(addId));
      setAddId("");
      await refresh(selected);
    } catch (e) {
      setError(errMsg(e));
    }
  }
  async function removeMember(uid: number) {
    if (!selected) return;
    try {
      await chefApi.removeProjectMember(selected, uid);
      await refresh(selected);
    } catch (e) {
      setError(errMsg(e));
    }
  }
  async function applyTeam() {
    if (!selected || !teamId) return;
    try {
      await chefApi.assignTeam(selected, Number(teamId));
      setTeamId("");
      await refresh(selected);
    } catch (e) {
      setError(errMsg(e));
    }
  }
  async function changeStatus(status: string) {
    if (!selected) return;
    try {
      await chefApi.updateProject(selected, { status });
      await refresh(selected);
    } catch (e) {
      setError(errMsg(e));
    }
  }

  if (loading) return <div className={`${cardCls} p-8 text-center text-sm text-slate-400`}>{t("chef.trackingPage.loading")}</div>;
  if (!overview || overview.projects.length === 0)
    return <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("chef.trackingPage.empty")}</div>;

  const totals = overview.totals;
  const candidates = members.filter((m) => !data?.team.some((x) => x.id === m.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("chef.trackingPage.title")}
        subtitle={t("chef.trackingPage.subtitle", { time: lastSync ? formatTime(lastSync) : "—" })}
        action={<button className={btnGhost} onClick={() => refresh(selected)}>↻ {t("common.refresh")}</button>}
      />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="cyan" label={t("chef.trackingPage.stats.projects")} value={totals.projects} hint={t("chef.trackingPage.stats.projectsHint", { inProgress: totals.in_progress, completed: totals.completed })} />
        <Stat tone="violet" label={t("chef.trackingPage.stats.avgProgress")} value={`${totals.avg_progress}%`} />
        <Stat tone="emerald" label={t("chef.trackingPage.stats.tasksDone")} value={`${totals.tasks_done}/${totals.tasks_total}`} />
        <Stat tone="rose" label={t("chef.trackingPage.stats.tasksLate")} value={<span className={totals.tasks_late ? "text-red-400" : ""}>{totals.tasks_late}</span>} />
      </div>

      <div className="flex flex-wrap gap-2">
        {overview.projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`rounded-xl border px-3 py-2 text-start text-sm transition ${selected === p.id ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"}`}
          >
            <span className="block max-w-[220px] truncate font-medium">{p.name}</span>
            <span className="text-xs text-slate-500">{statusLabel(p.status)} · {p.progress}%</span>
          </button>
        ))}
      </div>

      {data && (
        <>
          <div className={`${cardCls} p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-white">{data.project.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDate(data.project.start_date)} → {data.project.deadline ? formatDate(data.project.deadline) : t("chef.trackingPage.noDeadline")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t("chef.editProject.status")}</span>
                <select className={`${inputCls} !w-auto`} value={data.project.status} onChange={(e) => changeStatus(e.target.value)}>
                  {PROJECT_STATUSES.map((k) => <option key={k} value={k}>{statusLabel(k)}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-400">{t("chef.trackingPage.globalProgress")}</span>
                <span className="font-semibold text-white">{data.project.progress}%</span>
              </div>
              <ProgressBar value={data.project.progress} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={`${cardCls} p-6`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">{t("chef.projects.health")}</p>
              <p className="mt-2 text-4xl font-bold" style={{ color: healthColor(data.health.score) }}>{data.health.score}<span className="text-lg text-slate-500">/100</span></p>
              <p className="text-sm text-slate-300">{healthLabel(data.health.label)}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                {data.health.reasons.length === 0 ? (
                  <li>{t("chef.trackingPage.noAlert")} 🎉</li>
                ) : data.health.signals ? (
                  data.health.signals.map((s) => (
                    <li key={s.code}>
                      • {t(`chef.trackingPage.signals.${s.code}`, {
                        value: s.code === "ai_risk" ? riskLabel(String(s.value)) : s.value,
                        count: typeof s.value === "number" ? s.value : 0,
                      })}
                    </li>
                  ))
                ) : (
                  data.health.reasons.map((r) => <li key={r}>• {r}</li>)
                )}
              </ul>
            </div>
            <div className={`${cardCls} p-6`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">{t("chef.trackingPage.forecast")}</p>
              <p className="mt-2 text-2xl font-bold text-white">{data.forecast.eta ? formatDate(data.forecast.eta) : t("chef.trackingPage.notEnoughData")}</p>
              <p className={`text-sm ${data.forecast.on_track === false ? "text-red-400" : "text-emerald-400"}`}>
                {data.forecast.on_track == null ? t("chef.trackingPage.forecastHint") : data.forecast.on_track ? t("chef.trackingPage.onTrack") : t("chef.trackingPage.daysLate", { count: data.forecast.days_late ?? 0 })}
              </p>
              <p className="mt-3 text-xs text-slate-500">{t("chef.trackingPage.velocity", { velocity: data.forecast.velocity_per_day, remaining: data.forecast.remaining_hours })}</p>
            </div>
            <div className={`${cardCls} p-6`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">{t("chef.trackingPage.effort")}</p>
              <p className="mt-2 text-sm text-slate-300">{t("chef.trackingPage.plannedAi")} <b className="text-white">{data.project.planned_effort} {t("common.hoursShort")}</b></p>
              <p className="text-sm text-slate-300">{t("chef.trackingPage.predictedAi")} <b className="text-cyan-300">{data.project.predicted_effort ?? "—"} {t("common.hoursShort")}</b></p>
              <p className="text-sm text-slate-300">{t("chef.trackingPage.tasksHours", { estimated: data.stats.total_hours, spent: data.stats.spent_hours })}</p>
              <p className="mt-1 text-sm text-slate-300">{t("chef.projects.risk")} : <b className="text-white">{riskLabel(data.project.risk_level)}</b></p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={`${cardCls} p-5 lg:col-span-2`}>
              <p className="mb-2 text-sm font-semibold text-white">{t("chef.trackingPage.burndown")}</p>
              <Chart
                type="line"
                height={280}
                series={[
                  { name: t("chef.trackingPage.ideal"), data: data.burndown.map((b) => b.ideal) },
                  { name: t("chef.trackingPage.actual"), data: data.burndown.map((b) => b.actual) },
                ]}
                options={{
                  ...base,
                  stroke: { width: [2, 3], dashArray: [6, 0], curve: "smooth" },
                  colors: ["#64748b", "#22d3ee"],
                  xaxis: { categories: data.burndown.map((b) => formatDate(b.date, { day: "2-digit", month: "2-digit" })) },
                  yaxis: { labels: { formatter: (v) => `${Math.round(v)} ${t("common.hoursShort")}` } },
                  legend: { position: "top" },
                }}
              />
            </div>
            <div className={`${cardCls} p-5`}>
              <p className="mb-2 text-sm font-semibold text-white">{t("chef.trackingPage.taskSplit")}</p>
              <Chart
                type="donut"
                height={280}
                series={[data.stats.by_status.todo, data.stats.by_status.in_progress, data.stats.by_status.review, data.stats.by_status.done]}
                options={{
                  ...base,
                  labels: [t("chef.tasks.status.todo"), t("chef.tasks.status.in_progress"), t("chef.tasks.status.review"), t("chef.tasks.status.done")],
                  colors: ["#94a3b8", "#60a5fa", "#fbbf24", "#34d399"],
                  legend: { position: "bottom" },
                  stroke: { show: false },
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${cardCls} p-5`}>
              <p className="mb-2 text-sm font-semibold text-white">{t("chef.trackingPage.workload")}</p>
              {data.workload.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">{t("chef.trackingPage.noProjectMembers")}</p>
              ) : (
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: t("chef.trackingPage.openHours"), data: data.workload.map((w) => w.open_hours) }, { name: t("chef.trackingPage.weeklyCapacity"), data: data.workload.map((w) => w.capacity) }]}
                  options={{ ...base, colors: ["#a78bfa", "#334155"], xaxis: { categories: data.workload.map((w) => w.name) }, plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } }, legend: { position: "top" } }}
                />
              )}
            </div>
            <div className={`${cardCls} p-5`}>
              <p className="mb-3 text-sm font-semibold text-white">{t("chef.trackingPage.projectTeam")}</p>
              <div className="space-y-2">
                {data.team.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div>
                      <p className="text-sm text-white">{m.first_name} {m.last_name}</p>
                      <p className="text-xs text-slate-500">{m.job_title ?? m.email}</p>
                    </div>
                    <button className={`${btnDanger} !px-3 !py-1.5 !text-xs`} onClick={() => removeMember(m.id)}>{t("chef.members.remove")}</button>
                  </div>
                ))}
                {data.team.length === 0 && <p className="text-sm text-slate-500">{t("chef.trackingPage.noAssigned")}</p>}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label={t("chef.teamModal.addMember")}>
                  <div className="flex gap-2">
                    <select className={inputCls} value={addId} onChange={(e) => setAddId(e.target.value)}>
                      <option value="">{t("chef.trackingPage.choose")}</option>
                      {candidates.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                    <button className={btnPrimary} onClick={addMember} disabled={!addId}>+</button>
                  </div>
                </Field>
                <Field label={t("chef.trackingPage.assignTeam")}>
                  <div className="flex gap-2">
                    <select className={inputCls} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                      <option value="">{t("chef.trackingPage.choose")}</option>
                      {teams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                    <button className={btnPrimary} onClick={applyTeam} disabled={!teamId}>OK</button>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className={`${cardCls} p-5`}>
            <p className="mb-3 text-sm font-semibold text-white">{t("chef.trackingPage.activity")}</p>
            {data.activities.length === 0 ? (
              <p className="text-sm text-slate-500">{t("chef.trackingPage.noActivity")}</p>
            ) : (
              <ul className="space-y-2">
                {data.activities.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-2 text-sm last:border-0">
                    <span className="text-slate-200">{a.message}{a.user ? <span className="text-slate-500"> — {a.user}</span> : null}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDateTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
