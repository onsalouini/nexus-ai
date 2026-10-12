import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { api } from "../../lib/api";
import { useNavigate } from "react-router";
import EditProjectModal from "./EditProjectModal";
import { chefApi } from "../../services/chefApi";
import RiskExplanation from "../project/RiskExplanation";
import ReportHistory from "../project/ReportHistory";
import type { RiskExplanationData } from "../../types/projectRisk";
import { statusLabel } from "../ui-nexus/kit";
import { healthLabel, riskLabel } from "../../i18n/labels";
import { formatDateTime, formatNumber as formatLocaleNumber, formatDate } from "../../i18n/format";

type AIReport = {
  summary: string;
  health: "Bonne" | "Moyenne" | "Préoccupante" | "Critique";
  strengths: string[];
  risks: {
    title: string;
    description: string;
    severity: "Faible" | "Modérée" | "Élevée" | "Critique";
  }[];
  recommendations: string[];
  effort_analysis: string;
  final_verdict: string;
  model_explanation?: string;
  key_factors?: { factor: string; influence: string; explanation: string }[];
  confidence_note?: string;
};

type ProjectItem = {
  id: number;
  name: string;
  description: string | null;
  status: string;

  team_exp: number;
  manager_exp: number;
  length: number;
  transactions: number;
  entities: number;
  points_non_adjust: number;
  adjustment: number;
  language: number;

  planned_effort: number;
  predicted_effort?: number | null;

  risk_score?: number | null;
  risk_level: string | null;

  risk_explanation?: RiskExplanationData | null;

  ai_report?: AIReport | null;
  ai_report_generated_at?: string | null;

  progress?: number;
  start_date?: string | null;
  deadline?: string | null;
};

type Props = {
  projects: ProjectItem[];
  onRefresh?: () => void;
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  planifie: {
    label: "planifie",
    className: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  },
  en_cours: {
    label: "en_cours",
    className: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  },
  termine: {
    label: "termine",
    className: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  },
  
  suspendu: {
    label: "suspendu",
    className: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  },
};

const HEALTH_CONFIG: Record<
  AIReport["health"],
  {
    label: string;
    className: string;
    dot: string;
  }
> = {
  Bonne: {
    label: "Bonne",
    className: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    dot: "bg-emerald-400",
  },
  Moyenne: {
    label: "Moyenne",
    className: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
    dot: "bg-cyan-400",
  },
  Préoccupante: {
    label: "Préoccupante",
    className: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
  },
  Critique: {
    label: "Critique",
    className: "text-rose-300 bg-rose-400/10 border-rose-400/20",
    dot: "bg-rose-400",
  },
};

const SEVERITY_CONFIG: Record<
  AIReport["risks"][number]["severity"],
  string
> = {
  Faible: "text-emerald-300 bg-emerald-400/10",
  Modérée: "text-cyan-300 bg-cyan-400/10",
  Élevée: "text-amber-300 bg-amber-400/10",
  Critique: "text-rose-300 bg-rose-400/10",
};

function calculateGap(
  planned: number,
  predicted?: number | null
): number | null {
  if (
    predicted == null ||
    planned == null ||
    planned <= 0 ||
    Number.isNaN(planned)
  ) {
    return null;
  }

  return ((predicted - planned) / planned) * 100;
}

function formatNumber(value?: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }  return formatLocaleNumber(value, { maximumFractionDigits: 1 });
}

function getGapClass(gap: number | null): string {
  if (gap == null) return "text-slate-400";

  if (gap <= 0) return "text-emerald-300";
  if (gap <= 15) return "text-cyan-300";
  if (gap <= 35) return "text-amber-300";

  return "text-rose-300";
}

function getRiskClass(level: string | null): string {
  switch (level) {
    case "Faible":
      return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";

    case "Modéré":
    case "Modérée":
      return "text-cyan-300 bg-cyan-400/10 border-cyan-400/20";

    case "Moyen":
      return "text-amber-300 bg-amber-400/10 border-amber-400/20";

    case "Élevé":
      return "text-orange-300 bg-orange-400/10 border-orange-400/20";

    case "Critique":
      return "text-rose-300 bg-rose-400/10 border-rose-400/20";

    default:
      return "text-slate-300 bg-white/[0.04] border-white/[0.08]";
  }
}

function getRiskIcon(level: string | null) {
  switch (level) {
    case "Faible":
      return "✓";

    case "Modéré":
    case "Modérée":
      return "●";

    case "Moyen":
      return "▲";

    case "Élevé":
      return "⚠";

    case "Critique":
      return "!";
    
    default:
      return "•";
  }
}

export default function ProjectsGrid({
  projects,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<ProjectItem | null>(null);

  async function deleteProject(project: ProjectItem) {
    if (
      !window.confirm(
        t("chef.projects.confirmDelete", { name: project.name })
      )
    )
      return;
    try {
      await chefApi.deleteProject(project.id);
      onRefresh?.();
    } catch {
      window.alert(t("chef.projects.deleteError"));
    }
  }

  const [selectedProject, setSelectedProject] =
    useState<ProjectItem | null>(null);

  const [aiReport, setAiReport] =
    useState<AIReport | null>(null);

  const [generatingReport, setGeneratingReport] =
    useState(false);

  const [reportError, setReportError] =
    useState<string | null>(null);

  function onViewRisk(project: ProjectItem) {
    setSelectedProject(project);
    setAiReport(project.ai_report ?? null);
    setReportError(null);
  }

  function closeModal() {
    if (generatingReport) return;

    setSelectedProject(null);
    setAiReport(null);
    setReportError(null);
  }

  async function generateReport(project: ProjectItem) {
    try {
      setSelectedProject(project);
      setGeneratingReport(true);
      setReportError(null);
      setAiReport(null);

      const response = await api.post(
        `/projects/${project.id}/generate-report`
      );

      const report = response.data.report as AIReport;

      setAiReport(report);

      setSelectedProject((prev) =>
        prev
          ? { ...prev, ...(response.data.project as Partial<ProjectItem>) }
          : prev
      );

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: unknown) {
      console.error("Erreur génération bilan AI :", error);

      if (axios.isAxiosError(error)) {
        setReportError(
          error.response?.data?.message ||
            t("chef.projects.reportError")
        );
      } else {        setReportError(t("chef.projects.reportError"));
      }
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <>
      {/* =====================================================
          PROJECT GRID
      ====================================================== */}

      {projects.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05]">
            <svg
              className="h-7 w-7 text-cyan-300/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h3 className="text-base font-semibold text-white">
            {t("chef.projects.empty")}

          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {t("chef.projects.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {projects.map((project) => {
            const gap = calculateGap(
              project.planned_effort,
              project.predicted_effort
            );

            const status =
              STATUS_CONFIG[project.status] ??
              {
                label: project.status,
                className:
                  "text-slate-300 bg-white/[0.04] border-white/[0.08]",
              };

            const hasAnalysis =
              project.predicted_effort != null;

            return (
              <article
                key={project.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B1628]/80 p-5 transition-all duration-300 hover:border-cyan-400/20 hover:bg-[#0D1B30]"
              >
                {/* subtle glow */}
                <div className="pointer-events-none absolute -end-20 -top-20 h-40 w-40 rounded-full bg-cyan-400/[0.05] blur-3xl transition-opacity duration-300 group-hover:bg-cyan-400/[0.08]" />

                {/* HEADER */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-xs font-bold text-cyan-300">
                        {project.name.charAt(0).toUpperCase()}
                      </span>

                      <h3 className="truncate text-base font-semibold text-white">
                        {project.name}
                      </h3>
                    </div>

                    {project.description && (
                      <p className="line-clamp-2 max-w-xl text-sm leading-6 text-slate-400">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                  >
                    {statusLabel(status.label)}
                  </span>
                </div>

                {/* PROGRESS + ACTIONS */}
                <div className="relative mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                    <span>{t("chef.projects.progress")}{project.deadline ? ` · ${t("chef.projects.deadline", { date: formatDate(project.deadline) })}` : ""}</span>
                    <span className="font-semibold text-white">{project.progress ?? 0}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigate("/dashboard/chef/tracking")}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.06]"
                    >
                      {t("chef.projects.tracking")}

                    </button>
                    <button
                      onClick={() => setEditing(project)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.06]"
                    >
                      {t("common.edit")}

                    </button>
                    <button
                      onClick={() => deleteProject(project)}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      {t("common.delete")}

                    </button>
                  </div>
                </div>

                {/* SEPARATOR */}
                <div className="my-5 h-px bg-white/[0.06]" />

                {/* METRICS */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      {t("chef.projects.planned")}

                    </p>

                    <p className="mt-1.5 text-lg font-semibold text-white">
                      {formatNumber(project.planned_effort)}
                      <span className="ms-1 text-xs font-normal text-slate-500">
                        h
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      {t("chef.projects.aiEstimate")}
                    </p>

                    <p className="mt-1.5 text-lg font-semibold text-cyan-300">
                      {formatNumber(project.predicted_effort)}
                      <span className="ms-1 text-xs font-normal text-slate-500">
                        h
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      {t("chef.projects.gap")}

                    </p>

                    <p
                      className={`mt-1.5 text-lg font-semibold ${getGapClass(
                        gap
                      )}`}
                    >
                      {gap == null
                        ? "—"
                        : `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%`}
                    </p>
                  </div>
                </div>

                {/* RISK */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {t("chef.projects.aiRisk")}
                    </span>

                    {hasAnalysis ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getRiskClass(
                          project.risk_level
                        )}`}
                      >
                        <span>
                          {getRiskIcon(project.risk_level)}
                        </span>

                        {riskLabel(project.risk_level, t("common.notDefined"))}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {t("chef.projects.noAnalysis")}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewRisk(project)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    {t("chef.projects.viewAnalysis")}
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =====================================================
          MODAL
      ====================================================== */}

      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#071021] shadow-2xl shadow-black/40">
            {/* TOP LINE */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-5 border-b border-white/[0.06] px-6 py-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    NEXUS AI
                  </span>

                  <span className="text-slate-700">/</span>

                  <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    {t("chef.projects.intelligence")}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-white">
                  {selectedProject.name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {t("chef.projects.modalSubtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={generatingReport}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            {/* CONTENT */}
            <div className="max-h-[calc(92vh-100px)] overflow-y-auto px-6 py-6">
              {/* =================================================
                  QUICK OVERVIEW
              ================================================== */}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {t("chef.projects.plannedEffort")}
                  </p>

                  <p className="mt-1 text-xl font-semibold text-white">
                    {formatNumber(
                      selectedProject.planned_effort
                    )}
                    <span className="ms-1 text-xs text-slate-500">
                      h
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {t("chef.projects.estimatedEffort")}
                  </p>

                  <p className="mt-1 text-xl font-semibold text-cyan-300">
                    {formatNumber(
                      selectedProject.predicted_effort
                    )}
                    <span className="ms-1 text-xs text-slate-500">
                      h
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      {t("chef.projects.gap")}

                  </p>

                  <p
                    className={`mt-1 text-xl font-semibold ${getGapClass(
                      calculateGap(
                        selectedProject.planned_effort,
                        selectedProject.predicted_effort
                      )
                    )}`}
                  >
                    {calculateGap(
                      selectedProject.planned_effort,
                      selectedProject.predicted_effort
                    ) == null
                      ? "—"
                      : `${
                          calculateGap(
                            selectedProject.planned_effort,
                            selectedProject.predicted_effort
                          )! > 0
                            ? "+"
                            : ""
                        }${calculateGap(
                          selectedProject.planned_effort,
                          selectedProject.predicted_effort
                        )!.toFixed(1)}%`}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {t("chef.projects.risk")}

                  </p>

                  <p className="mt-1 text-xl font-semibold text-white">
                    {riskLabel(selectedProject.risk_level)}
                  </p>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="my-7 h-px bg-white/[0.06]" />

              {/* =================================================
                  GENERATE REPORT
              ================================================== */}

              {!aiReport && !generatingReport && (
                <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-r from-cyan-400/[0.04] via-violet-500/[0.04] to-blue-500/[0.04] px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {t("chef.projects.smartReport")}
                      </h3>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
                        {t("chef.projects.smartReportHint")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        generateReport(selectedProject)
                      }
                      disabled={
                        selectedProject.predicted_effort == null
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>

                      {t("chef.projects.generate")}
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================
                  LOADING
              ================================================== */}

              {generatingReport && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.05]">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    {t("chef.projects.analyzing")}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {t("chef.projects.preparing")}
                  </p>
                </div>
              )}

              {/* =================================================
                  ERROR
              ================================================== */}

              {reportError && (
                <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] px-5 py-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-400/10 text-sm text-rose-300">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-medium text-rose-200">
                        {t("chef.projects.generationFailed")}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-rose-200/60">
                        {reportError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  AI REPORT
              ================================================== */}

              {aiReport && (
                <div className="space-y-8">
                  {/* HEALTH */}
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t("chef.projects.health")}
                      </span>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                          HEALTH_CONFIG[aiReport.health].className
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            HEALTH_CONFIG[aiReport.health].dot
                          }`}
                        />

                        {healthLabel(aiReport.health)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {t("chef.projects.globalState")}
                      </h3>

                      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                        {aiReport.summary}
                      </p>
                    </div>
                  </section>

                  {/* STRENGTHS */}
                  {aiReport.strengths.length > 0 && (
                    <section>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="h-px w-5 bg-cyan-400/60" />

                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {t("chef.projects.strengths")}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {aiReport.strengths.map(
                          (strength, index) => (
                            <div
                              key={`${strength}-${index}`}
                              className="flex gap-3"
                            >
                              <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                                ✓
                              </span>

                              <p className="text-sm leading-6 text-slate-300">
                                {strength}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                  {/* RISKS */}
                  {aiReport.risks.length > 0 && (
                    <section>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="h-px w-5 bg-violet-400/60" />

                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {t("chef.projects.risks")}
                        </h3>
                      </div>

                      <div className="space-y-5">
                        {aiReport.risks.map(
                          (risk, index) => (
                            <div
                              key={`${risk.title}-${index}`}
                              className="flex gap-4"
                            >
                              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-xs font-semibold text-violet-300">
                                {String(index + 1).padStart(
                                  2,
                                  "0"
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-white">
                                    {risk.title}
                                  </h4>

                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      SEVERITY_CONFIG[
                                        risk.severity
                                      ]
                                    }`}
                                  >
                                    {riskLabel(risk.severity)}
                                  </span>
                                </div>

                                <p className="mt-1.5 text-sm leading-6 text-slate-400">
                                  {risk.description}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                  {/* RECOMMENDATIONS */}
                  {aiReport.recommendations.length > 0 && (
                    <section>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="h-px w-5 bg-cyan-400/60" />

                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {t("chef.projects.recommendations")}

                        </h3>
                      </div>

                      <div className="space-y-4">
                        {aiReport.recommendations.map(
                          (recommendation, index) => (
                            <div
                              key={`${recommendation}-${index}`}
                              className="flex gap-4"
                            >
                              <span className="pt-0.5 text-xs font-semibold text-cyan-300/70">
                                {String(index + 1).padStart(
                                  2,
                                  "0"
                                )}
                              </span>

                              <p className="text-sm leading-6 text-slate-300">
                                {recommendation}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                  {/* EFFORT */}
                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-px w-5 bg-blue-400/60" />

                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t("chef.projects.effortAnalysis")}
                      </h3>
                    </div>

                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                      <div className="flex items-end gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">
                            {t("chef.projects.planned")}

                          </p>

                          <p className="mt-1 text-2xl font-semibold text-white">
                            {formatNumber(
                              selectedProject.planned_effort
                            )}
                            <span className="ms-1 text-xs text-slate-500">
                              h
                            </span>
                          </p>
                        </div>

                        <span className="pb-1 text-xl text-slate-600">
                          →
                        </span>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">
                            {t("chef.projects.estimated")}

                          </p>

                          <p className="mt-1 text-2xl font-semibold text-cyan-300">
                            {formatNumber(
                              selectedProject.predicted_effort
                            )}
                            <span className="ms-1 text-xs text-slate-500">
                              h
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="max-w-xl text-sm leading-6 text-slate-400 md:text-end">
                        {aiReport.effort_analysis}
                      </div>
                    </div>
                  </section>

                  {/* EXPLICATION DU MODÈLE */}
                  <RiskExplanation
                    explanation={selectedProject.risk_explanation}
                    report={aiReport}
                  />

                  {/* VERDICT */}
                  <section className="border-t border-white/[0.06] pt-7">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="h-px w-5 bg-violet-400/60" />

                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t("chef.projects.verdict")}
                      </h3>
                    </div>

                    <p className="max-w-3xl text-base font-medium leading-7 text-white">
                      {aiReport.final_verdict}
                    </p>
                  </section>

                  {/* GENERATED DATE */}
                  {selectedProject.ai_report_generated_at && (
                    <div className="border-t border-white/[0.05] pt-4 text-xs text-slate-600">
                      {t("chef.projects.generatedAt", { date: formatDateTime(selectedProject.ai_report_generated_at) })}
                    </div>
                  )}

                  <ReportHistory
                    projectId={selectedProject.id}
                    refreshKey={selectedProject.ai_report_generated_at ? Date.parse(selectedProject.ai_report_generated_at) : 0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {editing && (
        <EditProjectModal
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={() => onRefresh?.()}
        />
      )}
    </>
  );
}