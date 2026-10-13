import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CalendarDays, CheckCircle2, Clock, FolderKanban, LifeBuoy, Mail, TrendingUp } from "lucide-react";
import { clientApi, type ClientProject, type ClientSchedule } from "../../services/clientApi";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Stat, btnPrimary, cardCls, errMsg } from "../../components/ui-nexus/kit";
import { SkeletonCards } from "../../components/ui-nexus/Skeleton";
import Avatar from "../../components/ui-nexus/Avatar";
import { formatDate, formatRelative } from "../../i18n/format";
import { toast } from "../../lib/toast";

const SCHEDULE: Record<ClientSchedule, { cls: string; ring: string }> = {
  on_track: { cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", ring: "#34d399" },
  watch: { cls: "border-amber-400/30 bg-amber-400/10 text-amber-200", ring: "#fbbf24" },
  late: { cls: "border-red-400/30 bg-red-500/10 text-red-200", ring: "#f87171" },
  done: { cls: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200", ring: "#22d3ee" },
};

/* Anneau d'avancement */
function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, Math.max(0, value))) / 100}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{value}%</span>
    </div>
  );
}

export default function ClientProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ClientProject[] | null>(null);

  useEffect(() => {
    clientApi
      .projects()
      .then(setProjects)
      .catch((e) => {
        toast.error(errMsg(e));
        setProjects([]);
      });
  }, []);

  const avg = projects?.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const openTickets = projects?.reduce((s, p) => s + p.open_tickets, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("client.projects.title", { name: user?.first_name ?? "" })}
        subtitle={t("client.projects.subtitle")}
        action={
          <button className={btnPrimary} onClick={() => navigate("/dashboard/client/tickets?new=1")}>
            <LifeBuoy className="h-4 w-4" />
            {t("client.tickets.new")}
          </button>
        }
      />

      {projects === null ? (
        <SkeletonCards count={2} />
      ) : projects.length === 0 ? (
        <div className={`${cardCls} flex flex-col items-center gap-3 p-12 text-center`}>
          <FolderKanban className="h-10 w-10 text-slate-600" />
          <p className="font-medium text-white">{t("client.projects.emptyTitle")}</p>
          <p className="max-w-md text-sm text-slate-400">{t("client.projects.empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat tone="cyan" label={t("client.projects.count")} value={projects.length} />
            <Stat tone="violet" label={t("client.projects.avgProgress")} value={`${avg}%`} />
            <Stat tone="amber" label={t("client.projects.openTickets")} value={openTickets} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {projects.map((p) => {
              const schedule = SCHEDULE[p.schedule];
              return (
                <article key={p.id} className={`${cardCls} space-y-5 p-6`}>
                  <div className="flex items-start gap-5">
                    <ProgressRing value={p.progress} color={schedule.ring} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-white">
                          <button type="button" className="hover:text-cyan-200" onClick={() => navigate(`/dashboard/client/projects/${p.id}`)}>
                            {p.name}
                          </button>
                        </h2>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${schedule.cls}`}>
                          {t(`client.schedule.${p.schedule}`)}
                        </span>
                      </div>
                      {p.description && <p className="line-clamp-2 text-sm text-slate-400">{p.description}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        {p.start_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {t("client.projects.start")} {formatDate(p.start_date)}
                          </span>
                        )}
                        {p.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {t("client.projects.deadline")} {formatDate(p.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(["total", "in_progress", "done"] as const).map((key) => (
                      <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5">
                        <p className="text-lg font-semibold text-white">{p.tasks[key]}</p>
                        <p className="text-[11px] text-slate-500">{t(`client.projects.tasks.${key}`)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-300/80">{t("client.projects.recent")}</p>
                      {p.recent_done.length === 0 ? (
                        <p className="text-xs text-slate-500">{t("client.projects.noneYet")}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {p.recent_done.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              <span className="min-w-0 flex-1 truncate">{item.title}</span>
                              <span className="shrink-0 text-[11px] text-slate-500">{formatRelative(item.date)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sky-300/80">{t("client.projects.upcoming")}</p>
                      {p.upcoming.length === 0 ? (
                        <p className="text-xs text-slate-500">{t("client.projects.noneYet")}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {p.upcoming.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                              <span className="min-w-0 flex-1 truncate">{item.title}</span>
                              <span className="shrink-0 text-[11px] text-slate-500">{formatDate(item.date)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                    {p.chef && (
                      <div className="flex items-center gap-3">
                        <Avatar person={p.chef} size="sm" />
                        <div className="text-sm">
                          <p className="text-white">
                            {p.chef.first_name} {p.chef.last_name}
                          </p>
                          <a href={`mailto:${p.chef.email}`} className="flex items-center gap-1 text-xs text-cyan-300 hover:underline" dir="ltr">
                            <Mail className="h-3 w-3" />
                            {p.chef.email}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/client/projects/${p.id}`)}
                      className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      <TrendingUp className="h-4 w-4" />
                      {t("client.projects.details")}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/client/tickets?new=1&project=${p.id}`)}
                      className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-400/20"
                    >
                      <LifeBuoy className="h-4 w-4" />
                      {t("client.projects.report")}
                      {p.open_tickets > 0 && <span className="rounded-full bg-amber-400/25 px-1.5 text-[11px]">{p.open_tickets}</span>}
                    </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
