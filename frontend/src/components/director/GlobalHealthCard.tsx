import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Activity, FolderKanban, LifeBuoy, Wallet } from "lucide-react";
import { workspaceApi, type HealthScore } from "../../services/workspaceApi";
import { healthLabel } from "../../i18n/labels";
import { Skeleton } from "../ui-nexus/Skeleton";
import { errMsg } from "../ui-nexus/kit";

const color = (score: number | null) =>
  score === null ? "#64748b" : score >= 80 ? "#34d399" : score >= 60 ? "#22d3ee" : score >= 40 ? "#fbbf24" : "#f87171";

/* Enterprise Health Score : projets + support + finance en un score global */
export default function GlobalHealthCard() {
  const { t } = useTranslation();
  const [data, setData] = useState<HealthScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workspaceApi
      .healthScore()
      .then(setData)
      .catch((e) => setError(errMsg(e, t("director.health.loadError"))));
  }, [t]);

  if (error) {
    return <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">{error}</div>;
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6" aria-busy="true">
        <Skeleton className="h-5 w-48" />
        <div className="mt-6 flex gap-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
    );
  }

  const parts = [
    { key: "projects", Icon: FolderKanban, score: data.components.projects.score, link: "/dashboard/direction/projects",
      detail: t("director.health.projectsDetail", { count: data.components.projects.count }) },
    { key: "support", Icon: LifeBuoy, score: data.components.support.score, link: "/dashboard/direction/support",
      detail: t("director.health.supportDetail", { open: data.components.support.open, critical: data.components.support.critical_open }) },
    { key: "finance", Icon: Wallet, score: data.components.finance.score, link: "/dashboard/direction/analytics",
      detail: data.components.finance.financial_health ? t(`director.health.finance_${data.components.finance.financial_health}`) : "" },
  ] as const;

  const ring = data.score ?? 0;

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <Activity className="h-3.5 w-3.5" />
            {t("director.health.eyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{t("director.health.title")}</h2>
        </div>
        <p className="text-xs text-slate-500">{t("director.health.weights")}</p>
      </div>

      <div className="mt-6 grid items-center gap-6 md:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-40 w-40">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${color(data.score)} ${ring * 3.6}deg, rgba(255,255,255,0.06) 0deg)` }}
          />
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#020617]">
            <span className="text-4xl font-bold" style={{ color: color(data.score) }}>
              {data.score ?? "—"}
            </span>
            <span className="text-xs text-slate-400">{data.label ? healthLabel(data.label) : t("director.health.noData")}</span>
          </div>
        </div>

        <div className="space-y-3">
          {parts.map(({ key, Icon, score, link, detail }) => (
            <Link
              key={key}
              to={link}
              className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-cyan-400/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{t(`director.health.${key}`)}</p>
                  <p className="text-sm font-semibold" style={{ color: color(score) }}>
                    {score ?? t("director.health.noDataShort")}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${score ?? 0}%`, backgroundColor: color(score) }} />
                </div>
                {detail && <p className="mt-1 truncate text-[11px] text-slate-500">{detail}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {data.components.projects.at_risk.length > 0 && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-2 text-xs text-slate-500">{t("director.health.watch")}</p>
          <div className="flex flex-wrap gap-2">
            {data.components.projects.at_risk.map((p) => (
              <Link
                key={p.id}
                to={`/dashboard/direction/projects/${p.id}`}
                className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-slate-300 hover:border-cyan-400/30"
              >
                {p.name} · <span style={{ color: color(p.score) }}>{p.score}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
