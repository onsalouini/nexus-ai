import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  
  
  Download,
  FileText,
  Loader2,
  PieChart,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { api } from "../../lib/api";

type FinancialIndicator = {
  id: number;
  financial_health_report_id: number;

  current_ratio: number;
  cash_total_assets: number;
  roa_before_interest_depreciation: number;
  operating_profit_rate: number;
  debt_ratio: number;
  net_worth_assets: number;
  working_capital_total_assets: number;
  net_income_total_assets: number;
  total_asset_turnover: number;
  retained_earnings_total_assets: number;
  interest_coverage_ratio: number;
  equity_liability: number;
  cash_flow_total_assets: number;
};

type FinancialExplanation = {
  id: number;
  feature: string;
  shap_value: number;
  impact: "increases_risk" | "decreases_risk";
};

type FinancialReport = {
  id: number;
  company_id: number;
  user_id: number;

  health_score: number;
  financial_health: "healthy" | "at_risk";
  bankruptcy_probability: number;
  decision_threshold: number;

  ai_analysis?: string | null;
  ai_recommendations?: string[] | null;

  model_version?: string | null;

  created_at: string;
  updated_at: string;

  company?: {
    id: number;
    name: string;
  };

  indicators?: FinancialIndicator | null;
  explanations?: FinancialExplanation[];
};

type HistoryResponse = {
  success: boolean;
  data: FinancialReport[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function normalizeScore(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return clamp(number);
}

function normalizeProbability(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  /*
   * Backend stocke la probabilité entre 0 et 1.
   */
  return clamp(number * 100);
}

/**
 * ============================================================
 * PETITE COURBE SVG
 * ============================================================
 */

function LineChart({
  reports,
  type,
}: {
  reports: FinancialReport[];
  type: "score" | "risk";
}) {
  if (reports.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
        Aucun historique disponible.
      </div>
    );
  }

  const width = 900;
  const height = 280;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = reports.map((report) =>
    type === "score"
      ? normalizeScore(report.health_score)
      : normalizeProbability(report.bankruptcy_probability)
  );

  const points = values.map((value, index) => {
    const x =
      reports.length === 1
        ? width / 2
        : paddingLeft +
          (index / (reports.length - 1)) * chartWidth;

    const y =
      paddingTop +
      chartHeight -
      (value / 100) * chartHeight;

    return { x, y, value };
  });

  const polyline = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints = [
    `${points[0].x},${paddingTop + chartHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${points[points.length - 1].x},${paddingTop + chartHeight}`,
  ].join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[700px] w-full"
      >
        {/* Grille */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y =
            paddingTop +
            chartHeight -
            (value / 100) * chartHeight;

          return (
            <g key={value}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="rgba(148,163,184,0.12)"
                strokeDasharray="5 5"
              />

              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Zone */}
        <polygon
          points={areaPoints}
          fill={
            type === "score"
              ? "rgba(34,211,238,0.08)"
              : "rgba(248,113,113,0.08)"
          }
        />

        {/* Ligne */}
        <polyline
          points={polyline}
          fill="none"
          stroke={
            type === "score"
              ? "#22d3ee"
              : "#fb7185"
          }
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <g key={`${point.x}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#020617"
              stroke={
                type === "score"
                  ? "#22d3ee"
                  : "#fb7185"
              }
              strokeWidth="3"
            />

            <text
              x={point.x}
              y={point.y - 13}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#e2e8f0"
            >
              {point.value.toFixed(1)}%
            </text>

            <text
              x={point.x}
              y={height - 15}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {formatShortDate(reports[index].created_at)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * ============================================================
 * BAR CHART
 * ============================================================
 */

function ComparisonBars({
  reports,
}: {
  reports: FinancialReport[];
}) {
  if (reports.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
        Aucun rapport enregistré.
      </div>
    );
  }

  const displayedReports = reports.slice(-8);

  return (
    <div className="flex h-[300px] items-end gap-4 overflow-x-auto px-2 pb-8 pt-8">
      {displayedReports.map((report) => {
        const score = normalizeScore(report.health_score);
        const risk = normalizeProbability(
          report.bankruptcy_probability
        );

        return (
          <div
            key={report.id}
            className="group flex min-w-[70px] flex-1 flex-col items-center justify-end"
          >
            <div className="mb-2 flex h-[210px] items-end gap-1.5">
              {/* Score */}
              <div
                className="relative w-7 rounded-t-lg bg-cyan-400/80 transition-all duration-500 group-hover:bg-cyan-300"
                style={{
                  height: `${Math.max(score * 2.05, 4)}px`,
                }}
                title={`Score : ${score.toFixed(1)}`}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-cyan-300">
                  {score.toFixed(0)}
                </span>
              </div>

              {/* Risk */}
              <div
                className="relative w-7 rounded-t-lg bg-rose-400/80 transition-all duration-500 group-hover:bg-rose-300"
                style={{
                  height: `${Math.max(risk * 2.05, 4)}px`,
                }}
                title={`Risque : ${risk.toFixed(1)}%`}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-rose-300">
                  {risk.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500">
              {formatShortDate(report.created_at)}
            </div>

            <div className="mt-1 text-[9px] text-slate-700">
              #{report.id}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * ============================================================
 * DONUT
 * ============================================================
 */

function HealthDonut({
  healthy,
  atRisk,
}: {
  healthy: number;
  atRisk: number;
}) {
  const total = healthy + atRisk;

  const healthyPercent =
    total > 0 ? (healthy / total) * 100 : 0;

  return (
    <div className="flex items-center gap-8">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(
            #34d399 0 ${healthyPercent}%,
            #fb7185 ${healthyPercent}% 100%
          )`,
        }}
      >
        <div className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-[#07111f]">
          <span className="text-2xl font-bold text-white">
            {total}
          </span>

          <span className="text-[10px] text-slate-500">
            rapports
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-300">
              Saines
            </span>
          </div>

          <p className="mt-1 text-xl font-bold text-emerald-400">
            {healthy}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="text-sm text-slate-300">
              À risque
            </span>
          </div>

          <p className="mt-1 text-xl font-bold text-rose-400">
            {atRisk}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function MonitoringPage() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showHistory, setShowHistory] =
    useState(false);

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const loadHistory = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response =
        await api.get<HistoryResponse>(
          "/financial-health/history"
        );

      const data = response.data.data ?? [];

      /*
       * Le backend renvoie latest().
       * Pour les graphiques, on remet les rapports
       * dans l'ordre chronologique.
       */
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

      setReports(sorted);
    } catch (err: unknown) {
      console.error(
        "Monitoring history error:",
        err
      );

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Impossible de récupérer l'historique financier."
        );
      } else {
        setError(
          "Impossible de récupérer l'historique financier."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /**
   * ==========================================================
   * STATISTIQUES
   * ==========================================================
   */

  const statistics = useMemo(() => {
    if (reports.length === 0) {
      return {
        averageScore: 0,
        averageRisk: 0,
        healthyCount: 0,
        atRiskCount: 0,
        healthyPercent: 0,
        trend: 0,
        latestScore: 0,
        latestRisk: 0,
      };
    }

    const scores = reports.map((report) =>
      normalizeScore(report.health_score)
    );

    const risks = reports.map((report) =>
      normalizeProbability(
        report.bankruptcy_probability
      )
    );

    const averageScore =
      scores.reduce((sum, value) => sum + value, 0) /
      scores.length;

    const averageRisk =
      risks.reduce((sum, value) => sum + value, 0) /
      risks.length;

    const healthyCount = reports.filter(
      (report) =>
        report.financial_health === "healthy"
    ).length;

    const atRiskCount =
      reports.length - healthyCount;

    const healthyPercent =
      (healthyCount / reports.length) * 100;

    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];

    return {
      averageScore,
      averageRisk,
      healthyCount,
      atRiskCount,
      healthyPercent,
      trend: lastScore - firstScore,
      latestScore: lastScore,
      latestRisk: risks[risks.length - 1],
    };
  }, [reports]);

  /**
   * ==========================================================
   * TÉLÉCHARGEMENT PDF
   * ==========================================================
   */

  const downloadReport = async (
    report: FinancialReport
  ) => {
    try {
      setDownloadingId(report.id);

      const response = await api.get(
        `/financial-health/reports/${report.id}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `rapport-sante-financiere-${report.id}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "PDF download error:",
        err
      );

      setError(
        "Impossible de télécharger le rapport PDF."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const latestReport =
    reports.length > 0
      ? reports[reports.length - 1]
      : null;

  const previousReport =
    reports.length > 1
      ? reports[reports.length - 2]
      : null;

  const scoreVariation =
    latestReport && previousReport
      ? normalizeScore(
          latestReport.health_score
        ) -
        normalizeScore(
          previousReport.health_score
        )
      : 0;

  const riskVariation =
    latestReport && previousReport
      ? normalizeProbability(
          latestReport.bankruptcy_probability
        ) -
        normalizeProbability(
          previousReport.bankruptcy_probability
        )
      : 0;

  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          </div>

          <p className="text-sm text-slate-400">
            Chargement du monitoring financier...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-7 pb-10 text-white">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <Activity className="h-6 w-6 text-cyan-300" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Monitoring financier
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Évolution de la santé financière de votre entreprise
              </p>
            </div>

          </div>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
          >
            <FileText className="h-4 w-4 text-cyan-300" />
            Historique des rapports
          </button>

          <button
            type="button"
            onClick={() => loadHistory(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Actualiser
          </button>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {reports.length === 0 ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.025] p-10 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
            <BarChart3 className="h-8 w-8 text-cyan-300" />
          </div>

          <h2 className="mt-5 text-xl font-semibold">
            Aucun bilan financier enregistré
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Lancez votre première analyse financière
            pour commencer à construire l'historique
            et visualiser l'évolution de votre entreprise.
          </p>

        </section>
      ) : (
        <>
          {/* ==================================================
              KPI
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Score */}
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Score actuel
                  </span>

                  <ShieldCheck className="h-5 w-5 text-cyan-300" />
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold">
                    {statistics.latestScore.toFixed(1)}
                  </span>

                  <span className="mb-1 text-sm text-slate-600">
                    /100
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  {scoreVariation >= 0 ? (
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5 text-rose-400" />
                  )}

                  <span
                    className={
                      scoreVariation >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  >
                    {Math.abs(scoreVariation).toFixed(1)}
                  </span>

                  <span className="text-slate-600">
                    vs bilan précédent
                  </span>
                </div>

              </div>
            </section>

            {/* Risque */}
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-400/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Risque de faillite
                  </span>

                  <AlertTriangle className="h-5 w-5 text-rose-300" />
                </div>

                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {statistics.latestRisk.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">

                  {riskVariation <= 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                  )}

                  <span
                    className={
                      riskVariation <= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  >
                    {Math.abs(riskVariation).toFixed(1)}%
                  </span>

                  <span className="text-slate-600">
                    vs précédent
                  </span>

                </div>

              </div>
            </section>

            {/* Moyenne */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Score moyen
                </span>

                <BarChart3 className="h-5 w-5 text-violet-300" />
              </div>

              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {statistics.averageScore.toFixed(1)}
                </span>

                <span className="ml-1 text-sm text-slate-600">
                  /100
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-violet-400"
                  style={{
                    width: `${statistics.averageScore}%`,
                  }}
                />
              </div>

            </section>

            {/* Rapports */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Bilans analysés
                </span>

                <FileText className="h-5 w-5 text-blue-300" />
              </div>

              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {reports.length}
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-600">
                {statistics.healthyPercent.toFixed(0)}%
                des bilans sont sains
              </p>

            </section>

          </div>

          {/* ==================================================
              COURBES
          ================================================== */}

          <div className="grid gap-6 xl:grid-cols-2">

            {/* Score */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-300" />

                    <h2 className="font-semibold">
                      Évolution du score
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    Score de santé financière sur les différents bilans
                  </p>
                </div>

                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                  /100
                </span>

              </div>

              <LineChart
                reports={reports}
                type="score"
              />

            </section>

            {/* Risque */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-rose-300" />

                    <h2 className="font-semibold">
                      Évolution du risque
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    Probabilité de faillite détectée par le modèle
                  </p>
                </div>

                <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs text-rose-300">
                  %
                </span>

              </div>

              <LineChart
                reports={reports}
                type="risk"
              />

            </section>

          </div>

          {/* ==================================================
              BAR CHART + DONUT
          ================================================== */}

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">

            {/* Bars */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-4">

                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-300" />

                  <h2 className="font-semibold">
                    Comparaison des bilans
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                  Score de santé vs probabilité de faillite
                </p>

              </div>

              <ComparisonBars
                reports={reports}
              />

              <div className="mt-3 flex justify-center gap-6 text-xs">

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
                  <span className="text-slate-500">
                    Score santé
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                  <span className="text-slate-500">
                    Risque faillite
                  </span>
                </div>

              </div>

            </section>

            {/* Donut */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-7">

                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-violet-300" />

                  <h2 className="font-semibold">
                    État financier
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                  Répartition des bilans enregistrés
                </p>

              </div>

              <HealthDonut
                healthy={
                  statistics.healthyCount
                }
                atRisk={
                  statistics.atRiskCount
                }
              />

            </section>

          </div>

          {/* ==================================================
              DERNIER RAPPORT
          ================================================== */}

          {latestReport && (
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    {latestReport.financial_health ===
                    "healthy" ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10">
                        <AlertTriangle className="h-5 w-5 text-rose-400" />
                      </div>
                    )}

                    <div>

                      <h2 className="font-semibold">
                        Dernier bilan financier
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        Généré le{" "}
                        {formatDate(
                          latestReport.created_at
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="flex items-center gap-5">

                  <div className="text-right">

                    <p className="text-xs text-slate-600">
                      Score
                    </p>

                    <p className="text-xl font-bold text-cyan-300">
                      {normalizeScore(
                        latestReport.health_score
                      ).toFixed(1)}
                    </p>

                  </div>

                  <div className="h-10 w-px bg-white/[0.08]" />

                  <div className="text-right">

                    <p className="text-xs text-slate-600">
                      Faillite
                    </p>

                    <p className="text-xl font-bold text-rose-300">
                      {normalizeProbability(
                        latestReport.bankruptcy_probability
                      ).toFixed(1)}
                      %
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      downloadReport(
                        latestReport
                      )
                    }
                    disabled={
                      downloadingId ===
                      latestReport.id
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    {downloadingId ===
                    latestReport.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}

                    PDF
                  </button>

                </div>

              </div>

            </section>
          )}
        </>
      )}

      {/* ======================================================
          MODAL HISTORIQUE
      ====================================================== */}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07111f] shadow-2xl">

            {/* Modal header */}

            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">

              <div>
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                    <FileText className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Historique des rapports
                    </h2>

                    <p className="text-xs text-slate-500">
                      Tous les bilans financiers enregistrés
                    </p>
                  </div>

                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHistory(false)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Modal content */}

            <div className="overflow-y-auto p-6">

              {reports.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Aucun rapport disponible.
                </div>
              ) : (
                <div className="space-y-3">

                  {[...reports]
                    .reverse()
                    .map((report) => {

                      const score =
                        normalizeScore(
                          report.health_score
                        );

                      const risk =
                        normalizeProbability(
                          report.bankruptcy_probability
                        );

                      const isHealthy =
                        report.financial_health ===
                        "healthy";

                      return (
                        <div
                          key={report.id}
                          className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.035]"
                        >

                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                            {/* Identity */}

                            <div className="flex min-w-0 items-center gap-4">

                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                  isHealthy
                                    ? "bg-emerald-400/10"
                                    : "bg-rose-400/10"
                                }`}
                              >
                                {isHealthy ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                                )}
                              </div>

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <span className="font-semibold text-slate-200">
                                    Rapport #{report.id}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                      isHealthy
                                        ? "bg-emerald-400/10 text-emerald-300"
                                        : "bg-rose-400/10 text-rose-300"
                                    }`}
                                  >
                                    {isHealthy
                                      ? "Saine"
                                      : "À risque"}
                                  </span>

                                </div>

                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                                  <CalendarDays className="h-3.5 w-3.5" />

                                  {formatDate(
                                    report.created_at
                                  )}
                                </div>

                              </div>

                            </div>

                            {/* Stats */}

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                              <div className="min-w-[90px] rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                  Score
                                </p>

                                <p className="mt-1 font-bold text-cyan-300">
                                  {score.toFixed(1)}
                                </p>
                              </div>

                              <div className="min-w-[90px] rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                  Faillite
                                </p>

                                <p className="mt-1 font-bold text-rose-300">
                                  {risk.toFixed(1)}%
                                </p>
                              </div>

                              <div className="min-w-[90px] rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                  Seuil
                                </p>

                                <p className="mt-1 font-bold text-violet-300">
                                  {(
                                    Number(
                                      report.decision_threshold
                                    ) * 100
                                  ).toFixed(0)}
                                  %
                                </p>
                              </div>

                              <div className="min-w-[90px] rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                  Modèle
                                </p>

                                <p className="mt-1 font-bold text-slate-300">
                                  {report.model_version ||
                                    "1.0.0"}
                                </p>
                              </div>

                            </div>

                            {/* Download */}

                            <button
                              type="button"
                              onClick={() =>
                                downloadReport(
                                  report
                                )
                              }
                              disabled={
                                downloadingId ===
                                report.id
                              }
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {downloadingId ===
                              report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}

                              Télécharger PDF
                            </button>

                          </div>

                          {/* Progress bars */}

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">

                            <div>
                              <div className="mb-1 flex justify-between text-[10px]">
                                <span className="text-slate-600">
                                  Santé financière
                                </span>

                                <span className="text-cyan-300">
                                  {score.toFixed(1)}
                                </span>
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                  className="h-full rounded-full bg-cyan-400"
                                  style={{
                                    width: `${score}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="mb-1 flex justify-between text-[10px]">
                                <span className="text-slate-600">
                                  Risque de faillite
                                </span>

                                <span className="text-rose-300">
                                  {risk.toFixed(1)}%
                                </span>
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                  className="h-full rounded-full bg-rose-400"
                                  style={{
                                    width: `${risk}%`,
                                  }}
                                />
                              </div>
                            </div>

                          </div>

                        </div>
                      );
                    })}

                </div>
              )}

            </div>

            {/* Footer */}

            <div className="border-t border-white/[0.08] px-6 py-4">

              <div className="flex items-center justify-between text-xs text-slate-600">

                <span>
                  {reports.length} rapport
                  {reports.length > 1
                    ? "s"
                    : ""}{" "}
                  enregistré
                  {reports.length > 1
                    ? "s"
                    : ""}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setShowHistory(false)
                  }
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Fermer
                </button>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}