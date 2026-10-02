import { useCallback, useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { chefApi, type Member, type Overview, type Team, type Tracking } from "../../services/chefApi";
import {
  Field,
  PageHeader,
  ProgressBar,
  STATUS_LABEL,
  Stat,
  btnGhost,
  btnPrimary,
  btnDanger,
  cardCls,
  errMsg,
  inputCls,
} from "../../components/ui-nexus/kit";

const base: ApexOptions = {
  chart: { toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  tooltip: { theme: "dark" },
};

const healthColor = (s: number) => (s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : s >= 40 ? "#fb923c" : "#f87171");

export default function TrackingPage() {
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
      setError(errMsg(e, "Impossible de charger le suivi."));
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (loading) return <div className={`${cardCls} p-8 text-center text-sm text-slate-400`}>Chargement du suivi…</div>;
  if (!overview || overview.projects.length === 0)
    return <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>Aucun projet à suivre. Créez un projet pour commencer.</div>;

  const t = overview.totals;
  const candidates = members.filter((m) => !data?.team.some((x) => x.id === m.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi de projet"
        subtitle={`Données en temps réel — dernière synchro ${lastSync ? lastSync.toLocaleTimeString("fr-FR") : "—"}`}
        action={<button className={btnGhost} onClick={() => refresh(selected)}>↻ Actualiser</button>}
      />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Projets" value={t.projects} hint={`${t.in_progress} en cours · ${t.completed} terminés`} />
        <Stat label="Avancement moyen" value={`${t.avg_progress}%`} />
        <Stat label="Tâches terminées" value={`${t.tasks_done}/${t.tasks_total}`} />
        <Stat label="Tâches en retard" value={<span className={t.tasks_late ? "text-red-400" : ""}>{t.tasks_late}</span>} />
      </div>

      <div className="flex flex-wrap gap-2">
        {overview.projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${selected === p.id ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"}`}
          >
            <span className="block max-w-[220px] truncate font-medium">{p.name}</span>
            <span className="text-xs text-slate-500">{STATUS_LABEL[p.status] ?? p.status} · {p.progress}%</span>
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
                  {data.project.start_date ?? "—"} → {data.project.deadline ?? "pas d'échéance"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Statut</span>
                <select className={`${inputCls} !w-auto`} value={data.project.status} onChange={(e) => changeStatus(e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-400">Avancement global</span>
                <span className="font-semibold text-white">{data.project.progress}%</span>
              </div>
              <ProgressBar value={data.project.progress} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={`${cardCls} p-6`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">Santé du projet</p>
              <p className="mt-2 text-4xl font-bold" style={{ color: healthColor(data.health.score) }}>{data.health.score}<span className="text-lg text-slate-500">/100</span></p>
              <p className="text-sm text-slate-300">{data.health.label}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                {data.health.reasons.length === 0 ? <li>Aucun signal d'alerte 🎉</li> : data.health.reasons.map((r) => <li key={r}>• {r}</li>)}
              </ul>
            </div>
            <div className={`${cardCls} p-6`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">Prévision de fin (vélocité)</p>
              <p className="mt-2 text-2xl font-bold text-white">{data.forecast.eta ?? "Données insuffisantes"}</p>
              <p className={`text-sm ${data.forecast.on_track === false ? "text-red-400" : "text-emerald-400"}`}>
                {data.forecast.on_track == null ? "Terminez une tâche pour activer la prévision" : data.forecast.on_track ? "Dans les délais" : `Retard estimé : ${data.forecast.days_late} jour(s)`}
              </p>
              <p className="mt-3 text-xs text-slate-500">{data.forecast.velocity_per_day} h/jour · {data.forecast.remaining_hours} h restantes</p>
            </div>
            <div className={`${cardCls} p-6`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">Effort</p>
              <p className="mt-2 text-sm text-slate-300">Planifié IA : <b className="text-white">{data.project.planned_effort} h</b></p>
              <p className="text-sm text-slate-300">Prédit IA : <b className="text-cyan-300">{data.project.predicted_effort ?? "—"} h</b></p>
              <p className="text-sm text-slate-300">Tâches : <b className="text-white">{data.stats.total_hours} h</b> estimées / <b className="text-white">{data.stats.spent_hours} h</b> passées</p>
              <p className="mt-1 text-sm text-slate-300">Risque : <b className="text-white">{data.project.risk_level ?? "—"}</b></p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={`${cardCls} p-5 lg:col-span-2`}>
              <p className="mb-2 text-sm font-semibold text-white">Courbe de burndown (heures restantes)</p>
              <Chart
                type="line"
                height={280}
                series={[
                  { name: "Idéal", data: data.burndown.map((b) => b.ideal) },
                  { name: "Réel", data: data.burndown.map((b) => b.actual) },
                ]}
                options={{
                  ...base,
                  stroke: { width: [2, 3], dashArray: [6, 0], curve: "smooth" },
                  colors: ["#64748b", "#22d3ee"],
                  xaxis: { categories: data.burndown.map((b) => b.date.slice(5)) },
                  yaxis: { labels: { formatter: (v) => `${Math.round(v)} h` } },
                  legend: { position: "top" },
                }}
              />
            </div>
            <div className={`${cardCls} p-5`}>
              <p className="mb-2 text-sm font-semibold text-white">Répartition des tâches</p>
              <Chart
                type="donut"
                height={280}
                series={[data.stats.by_status.todo, data.stats.by_status.in_progress, data.stats.by_status.review, data.stats.by_status.done]}
                options={{
                  ...base,
                  labels: ["À faire", "En cours", "En revue", "Terminé"],
                  colors: ["#94a3b8", "#60a5fa", "#fbbf24", "#34d399"],
                  legend: { position: "bottom" },
                  stroke: { show: false },
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${cardCls} p-5`}>
              <p className="mb-2 text-sm font-semibold text-white">Charge par membre (heures restantes)</p>
              {data.workload.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">Aucun membre dans le projet.</p>
              ) : (
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: "Heures ouvertes", data: data.workload.map((w) => w.open_hours) }, { name: "Capacité /sem", data: data.workload.map((w) => w.capacity) }]}
                  options={{ ...base, colors: ["#a78bfa", "#334155"], xaxis: { categories: data.workload.map((w) => w.name) }, plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } }, legend: { position: "top" } }}
                />
              )}
            </div>
            <div className={`${cardCls} p-5`}>
              <p className="mb-3 text-sm font-semibold text-white">Équipe du projet</p>
              <div className="space-y-2">
                {data.team.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div>
                      <p className="text-sm text-white">{m.first_name} {m.last_name}</p>
                      <p className="text-xs text-slate-500">{m.job_title ?? m.email}</p>
                    </div>
                    <button className={`${btnDanger} !px-3 !py-1.5 !text-xs`} onClick={() => removeMember(m.id)}>Retirer</button>
                  </div>
                ))}
                {data.team.length === 0 && <p className="text-sm text-slate-500">Aucun membre affecté.</p>}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Ajouter un membre">
                  <div className="flex gap-2">
                    <select className={inputCls} value={addId} onChange={(e) => setAddId(e.target.value)}>
                      <option value="">Choisir…</option>
                      {candidates.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                    <button className={btnPrimary} onClick={addMember} disabled={!addId}>+</button>
                  </div>
                </Field>
                <Field label="Affecter une équipe">
                  <div className="flex gap-2">
                    <select className={inputCls} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                      <option value="">Choisir…</option>
                      {teams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                    <button className={btnPrimary} onClick={applyTeam} disabled={!teamId}>OK</button>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className={`${cardCls} p-5`}>
            <p className="mb-3 text-sm font-semibold text-white">Activité récente</p>
            {data.activities.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune activité pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {data.activities.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-2 text-sm last:border-0">
                    <span className="text-slate-200">{a.message}{a.user ? <span className="text-slate-500"> — {a.user}</span> : null}</span>
                    <span className="shrink-0 text-xs text-slate-500">{new Date(a.created_at).toLocaleString("fr-FR")}</span>
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
