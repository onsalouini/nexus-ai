import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GitCompare, History } from "lucide-react";
import { workspaceApi, type ProjectReportEntry } from "../../services/workspaceApi";
import { formatDateTime, formatNumber } from "../../i18n/format";
import { healthLabel, riskLabel } from "../../i18n/labels";
import { Skeleton } from "../ui-nexus/Skeleton";

/* Historique des bilans IA d'un projet + comparaison de deux versions */
export default function ReportHistory({ projectId, refreshKey = 0 }: { projectId: number; refreshKey?: number }) {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ProjectReportEntry[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    workspaceApi
      .projectReports(projectId)
      .then((list) => {
        setReports(list);
        setSelected(list.slice(0, 2).map((r) => r.id));
      })
      .catch(() => setReports([]));
  }, [projectId, refreshKey]);

  if (reports === null) return <Skeleton className="h-24" />;
  if (reports.length === 0) return null;

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)));
  }

  // Ordre chronologique : la plus ancienne à gauche
  const compared = reports.filter((r) => selected.includes(r.id)).sort((a, b) => a.id - b.id);

  const rows: { label: string; value: (r: ProjectReportEntry) => string }[] = [
    { label: t("reportHistory.generated"), value: (r) => formatDateTime(r.created_at) },
    { label: t("reportHistory.trigger"), value: (r) => t(`reportHistory.triggers.${r.trigger}`) },
    { label: t("chef.projects.health"), value: (r) => healthLabel(r.report.health) },
    { label: t("chef.projects.risk"), value: (r) => riskLabel(r.risk_level) },
    { label: t("chef.projects.plannedEffort"), value: (r) => `${formatNumber(r.planned_effort)} ${t("common.hoursShort")}` },
    { label: t("chef.projects.estimatedEffort"), value: (r) => `${formatNumber(r.predicted_effort)} ${t("common.hoursShort")}` },
    { label: t("chef.projects.gap"), value: (r) => (r.risk_score == null ? "—" : `${r.risk_score > 0 ? "+" : ""}${r.risk_score}%`) },
    { label: t("chef.projects.risks"), value: (r) => String(r.report.risks?.length ?? 0) },
    { label: t("chef.projects.verdict"), value: (r) => r.report.final_verdict },
  ];

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <History className="h-4 w-4 text-cyan-300" />
        {t("reportHistory.title", { count: reports.length })}
      </h3>
      <p className="mt-1 text-xs text-slate-500">{t("reportHistory.hint")}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {reports.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => toggle(r.id)}
            className={`rounded-xl border px-3 py-2 text-start text-xs transition ${
              selected.includes(r.id) ? "border-cyan-400/40 bg-cyan-400/10 text-white" : "border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            <span className="block">{formatDateTime(r.created_at)}</span>
            <span className="text-[10px] text-slate-500">
              {t(`reportHistory.triggers.${r.trigger}`)} · {healthLabel(r.report.health)}
            </span>
          </button>
        ))}
      </div>

      {compared.length === 2 && (
        <div className="mt-5 overflow-x-auto">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-violet-300">
            <GitCompare className="h-3.5 w-3.5" />
            {t("reportHistory.compare")}
          </p>
          <table className="w-full min-w-[520px] text-sm">
            <tbody>
              {rows.map((row) => {
                const [a, b] = compared.map(row.value);
                return (
                  <tr key={row.label} className="border-t border-white/[0.05] align-top">
                    <th className="w-40 py-2 pe-3 text-start text-xs font-medium text-slate-500">{row.label}</th>
                    <td className="py-2 pe-3 text-slate-300">{a}</td>
                    <td className={`py-2 ${a !== b ? "text-cyan-200" : "text-slate-300"}`}>{b}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
