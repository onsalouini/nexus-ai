// Résultat du modèle de risque + bilan explicable (Groq) pour un projet
import { useState } from "react";
import axios from "axios";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { api } from "../../lib/api";
import RiskExplanation from "./RiskExplanation";
import type {
  AIReportData,
  RiskExplanationData,
} from "../../types/projectRisk";

export type RiskProject = {
  id: number;
  planned_effort: number;
  predicted_effort: number | null;
  risk_score: number | null;
  risk_level: string | null;
  risk_explanation: RiskExplanationData | null;
  ai_report: AIReportData | null;
  ai_report_generated_at: string | null;
};

type Props = {
  project: RiskProject;
  /** Appelé avec les champs mis à jour après génération du bilan. */
  onChange: (patch: Partial<RiskProject>) => void;
};

const RISK_STYLE: Record<string, string> = {
  Faible: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Modéré: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  Élevé: "text-orange-300 bg-orange-400/10 border-orange-400/20",
  Indéterminé: "text-slate-300 bg-white/[0.04] border-white/[0.08]",
};

const HEALTH_STYLE: Record<AIReportData["health"], string> = {
  Bonne: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Moyenne: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  Préoccupante: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Critique: "text-rose-300 bg-rose-400/10 border-rose-400/20",
};

const SEVERITY_STYLE: Record<
  AIReportData["risks"][number]["severity"],
  string
> = {
  Faible: "text-emerald-300 bg-emerald-400/10",
  Modérée: "text-cyan-300 bg-cyan-400/10",
  Élevée: "text-amber-300 bg-amber-400/10",
  Critique: "text-rose-300 bg-rose-400/10",
};

function formatHours(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value).toLocaleString("fr-FR")} h`;
}

function computeGap(planned: number, predicted: number | null): number | null {
  if (predicted == null || !planned || planned <= 0) return null;
  return ((predicted - planned) / planned) * 100;
}

function SectionTitle({
  children,
  accent = "bg-cyan-400/60",
}: {
  children: string;
  accent?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={`h-px w-5 ${accent}`} />
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {children}
      </h3>
    </div>
  );
}

export default function ProjectRiskSection({ project, onChange }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = project.ai_report;
  const gap = computeGap(project.planned_effort, project.predicted_effort);

  async function generate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await api.post<{
        project: Partial<RiskProject>;
        report: AIReportData;
      }>(`/projects/${project.id}/generate-report`);

      onChange({ ...res.data.project, ai_report: res.data.report });
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Impossible de générer le bilan AI."
          : "Impossible de générer le bilan AI."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* ======================= RÉSULTAT DU MODÈLE ======================= */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Résultat du modèle de risque</h2>
            <p className="text-xs text-slate-600">
              Estimation d'effort calculée par le modèle ML
            </p>
          </div>

          {project.risk_level && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                RISK_STYLE[project.risk_level] ?? RISK_STYLE["Indéterminé"]
              }`}
            >
              Risque {project.risk_level}
            </span>
          )}
        </div>

        {project.predicted_effort == null ? (
          <p className="text-sm text-slate-500">
            Aucune prédiction enregistrée pour ce projet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
              <p className="text-xs text-slate-600">Effort planifié</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatHours(project.planned_effort)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
              <p className="text-xs text-slate-600">Effort estimé par le modèle</p>
              <p className="mt-2 text-lg font-semibold text-cyan-300">
                {formatHours(project.predicted_effort)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
              <p className="text-xs text-slate-600">Écart</p>
              <p
                className={`mt-2 text-lg font-semibold ${
                  gap == null
                    ? "text-slate-400"
                    : gap > 10
                    ? "text-orange-300"
                    : "text-emerald-300"
                }`}
              >
                {gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap.toFixed(1)} %`}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
              <p className="text-xs text-slate-600">Niveau de risque</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {project.risk_level ?? "—"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ======================= BILAN EXPLICABLE ======================= */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
              <Sparkles className="h-4 w-4 text-violet-300" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">Bilan explicable</h2>
              <p className="text-xs text-slate-600">
                Analyse complète rédigée par NEXUS AI à partir du modèle
              </p>
            </div>
          </div>

          {(report || project.predicted_effort != null) && (
            <button
              type="button"
              onClick={generate}
              disabled={generating || project.predicted_effort == null}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : report ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating
                ? "Analyse en cours…"
                : report
                ? "Régénérer le bilan"
                : "Générer le bilan"}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] px-5 py-4 text-sm text-rose-200/80">
            {error}
          </div>
        )}

        {!report && !generating && !error && (
          <p className="text-sm leading-6 text-slate-500">
            Aucun bilan n'a encore été généré pour ce projet. Le bilan explique
            pourquoi le modèle estime cet effort, quels facteurs pèsent le plus,
            les risques et les recommandations.
          </p>
        )}

        {generating && (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
            <p className="text-sm text-slate-500">NEXUS AI prépare le bilan…</p>
          </div>
        )}

        {report && !generating && (
          <div className="space-y-8">
            {/* SYNTHÈSE */}
            <div>
              <span
                className={`mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  HEALTH_STYLE[report.health]
                }`}
              >
                Santé du projet : {report.health}
              </span>

              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                {report.summary}
              </p>
            </div>

            {/* EXPLICABILITÉ */}
            <RiskExplanation
              explanation={project.risk_explanation}
              report={report}
            />

            {/* POINTS FORTS */}
            {report.strengths.length > 0 && (
              <section>
                <SectionTitle>Points forts</SectionTitle>
                <ul className="space-y-2.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                        ✓
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* RISQUES */}
            {report.risks.length > 0 && (
              <section>
                <SectionTitle accent="bg-rose-400/60">Risques identifiés</SectionTitle>
                <div className="space-y-3">
                  {report.risks.map((risk, i) => (
                    <div
                      key={`${risk.title}-${i}`}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{risk.title}</p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                            SEVERITY_STYLE[risk.severity]
                          }`}
                        >
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-xs leading-6 text-slate-400">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RECOMMANDATIONS */}
            {report.recommendations.length > 0 && (
              <section>
                <SectionTitle>Recommandations</SectionTitle>
                <ol className="space-y-3">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-4 text-sm leading-6 text-slate-300">
                      <span className="pt-0.5 text-xs font-semibold text-cyan-300/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {r}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* ANALYSE DE L'ÉCART */}
            {report.effort_analysis && (
              <section>
                <SectionTitle accent="bg-blue-400/60">Analyse de l'écart d'effort</SectionTitle>
                <p className="max-w-3xl text-sm leading-7 text-slate-400">
                  {report.effort_analysis}
                </p>
              </section>
            )}

            {/* VERDICT */}
            <section className="border-t border-white/[0.06] pt-7">
              <SectionTitle accent="bg-violet-400/60">Verdict final</SectionTitle>
              <p className="max-w-3xl text-base font-medium leading-7 text-white">
                {report.final_verdict}
              </p>
            </section>

            {project.ai_report_generated_at && (
              <p className="border-t border-white/[0.05] pt-4 text-xs text-slate-600">
                Bilan généré le{" "}
                {new Date(project.ai_report_generated_at).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
