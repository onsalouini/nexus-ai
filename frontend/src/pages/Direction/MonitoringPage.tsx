import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { api } from "../../lib/api";

type FinancialHealth = "healthy" | "at_risk";

type Indicator = {
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

type FinancialReport = {
  id: number;
  company_id: number;
  user_id: number;

  health_score: number;
  financial_health: FinancialHealth;
  bankruptcy_probability: number;
  decision_threshold: number;

  ai_analysis: string | null;
  ai_recommendations: string[] | null;
  model_version: string | null;

  created_at: string;
  updated_at: string;

  indicators?: Indicator | null;
};

type HistoryResponse = {
  success: boolean;
  data: FinancialReport[];
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatShortDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function normalizeProbability(value: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  /*
   * Laravel stocke actuellement une probabilité
   * entre 0 et 1.
   */
  return Math.min(Math.max(number, 0), 1);
}

function normalizeScore(value: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(Math.max(number, 0), 100);
}

export default function MonitoringPage() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<HistoryResponse>(
            "/financial-health/history"
          );

        if (!mounted) {
          return;
        }

        if (!response.data.success) {
          throw new Error(
            "Impossible de récupérer l'historique financier."
          );
        }

        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        /*
         * On trie toujours du plus ancien
         * au plus récent pour les courbes.
         */
        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

        setReports(sorted);
      } catch (err: unknown) {
        console.error(
          "Monitoring financial history error:",
          err
        );

        if (!mounted) {
          return;
        }

        if (axios.isAxiosError(err)) {
          const responseData = err.response?.data as
            | Record<string, unknown>
            | undefined;

          const message =
            typeof responseData?.message === "string"
              ? responseData.message
              : typeof responseData?.detail === "string"
                ? responseData.detail
                : "Impossible de charger les données du monitoring.";

          setError(message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Une erreur inattendue est survenue."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ==========================================================
   * STATISTIQUES
   * ==========================================================
   */

  const statistics = useMemo(() => {
    if (reports.length === 0) {
      return {
        averageScore: 0,
        averageProbability: 0,
        healthyCount: 0,
        riskCount: 0,
        latest: null as FinancialReport | null,
      };
    }

    const totalScore = reports.reduce(
      (sum, report) =>
        sum + normalizeScore(report.health_score),
      0
    );

    const totalProbability = reports.reduce(
      (sum, report) =>
        sum +
        normalizeProbability(
          report.bankruptcy_probability
        ),
      0
    );

    const healthyCount = reports.filter(
      (report) =>
        report.financial_health === "healthy"
    ).length;

    const riskCount = reports.filter(
      (report) =>
        report.financial_health === "at_risk"
    ).length;

    return {
      averageScore: totalScore / reports.length,
      averageProbability:
        totalProbability / reports.length,
      healthyCount,
      riskCount,
      latest: reports[reports.length - 1],
    };
  }, [reports]);

  /*
   * ==========================================================
   * EVOLUTION
   * ==========================================================
   */

  const scoreEvolution = useMemo(() => {
    return reports.map((report) => ({
      id: report.id,
      date: formatShortDate(report.created_at),
      score: normalizeScore(report.health_score),
    }));
  }, [reports]);

  const probabilityEvolution = useMemo(() => {
    return reports.map((report) => ({
      id: report.id,
      date: formatShortDate(report.created_at),
      probability:
        normalizeProbability(
          report.bankruptcy_probability
        ) * 100,
    }));
  }, [reports]);

  /*
   * ==========================================================
   * TENDANCE
   * ==========================================================
   */

  const trend = useMemo(() => {
    if (reports.length < 2) {
      return {
        score: 0,
        probability: 0,
      };
    }

    const previous = reports[reports.length - 2];
    const current = reports[reports.length - 1];

    const previousScore = normalizeScore(
      previous.health_score
    );

    const currentScore = normalizeScore(
      current.health_score
    );

    const previousProbability =
      normalizeProbability(
        previous.bankruptcy_probability
      ) * 100;

    const currentProbability =
      normalizeProbability(
        current.bankruptcy_probability
      ) * 100;

    return {
      score: currentScore - previousScore,
      probability:
        currentProbability - previousProbability,
    };
  }, [reports]);

  /*
   * ==========================================================
   * ETAT VIDE
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          Chargement du monitoring...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <Activity className="h-5 w-5 text-cyan-300" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Monitoring
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Vue globale de l'évolution de la santé
                financière de l'entreprise
              </p>
            </div>

          </div>
        </div>

        {statistics.latest && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
            <p className="text-xs text-slate-500">
              Dernière analyse
            </p>

            <p className="mt-1 text-sm font-medium text-slate-200">
              {formatDate(
                statistics.latest.created_at
              )}
            </p>
          </div>
        )}

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">

          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Erreur de chargement
            </p>

            <p className="mt-1 text-red-300/80">
              {error}
            </p>
          </div>

        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {reports.length === 0 ? (

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-10 text-center">

          <BarChart3 className="mx-auto h-10 w-10 text-slate-600" />

          <h2 className="mt-4 text-lg font-semibold">
            Aucune donnée disponible
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Effectuez au moins une analyse financière
            pour commencer à visualiser l'évolution
            de la santé de votre entreprise.
          </p>

        </section>

      ) : (

        <>
          {/* =================================================
              KPI
          ================================================= */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* SCORE */}

            <KpiCard
              title="Score moyen"
              value={`${statistics.averageScore.toFixed(1)}/100`}
              icon={
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              }
              trend={trend.score}
              trendType="score"
            />

            {/* FAILLITE */}

            <KpiCard
              title="Probabilité moyenne"
              value={`${statistics.averageProbability * 100 >= 0
                ? (statistics.averageProbability * 100).toFixed(1)
                : "0.0"}%`}
              icon={
                <BrainCircuit className="h-5 w-5 text-violet-300" />
              }
              trend={trend.probability}
              trendType="probability"
            />

            {/* SAINES */}

            <KpiCard
              title="Analyses saines"
              value={String(
                statistics.healthyCount
              )}
              icon={
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              }
            />

            {/* RISQUE */}

            <KpiCard
              title="Analyses à risque"
              value={String(
                statistics.riskCount
              )}
              icon={
                <AlertTriangle className="h-5 w-5 text-red-300" />
              }
            />

          </div>

          {/* =================================================
              CHARTS
          ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {/* SCORE */}

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-6 flex items-start justify-between">

                <div>
                  <div className="flex items-center gap-2">

                    <TrendingUp className="h-5 w-5 text-cyan-300" />

                    <h2 className="text-base font-semibold">
                      Évolution du score de santé
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Progression du score sur les analyses
                    enregistrées
                  </p>
                </div>

                <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300">
                  / 100
                </span>

              </div>

              <div className="h-72">
                <SimpleLineChart
                  data={scoreEvolution}
                  valueKey="score"
                  max={100}
                  suffix=""
                />
              </div>

            </section>

            {/* PROBABILITE */}

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-6 flex items-start justify-between">

                <div>
                  <div className="flex items-center gap-2">

                    <TrendingDown className="h-5 w-5 text-violet-300" />

                    <h2 className="text-base font-semibold">
                      Évolution du risque de faillite
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Probabilité prédite par le modèle
                  </p>
                </div>

                <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs text-violet-300">
                  %
                </span>

              </div>

              <div className="h-72">
                <SimpleLineChart
                  data={probabilityEvolution}
                  valueKey="probability"
                  max={100}
                  suffix="%"
                />
              </div>

            </section>

          </div>

          {/* =================================================
              SITUATION
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

            <div className="mb-6 flex items-center gap-2">

              <Activity className="h-5 w-5 text-cyan-300" />

              <div>
                <h2 className="text-base font-semibold">
                  Évolution des situations
                </h2>

                <p className="text-xs text-slate-500">
                  Répartition des analyses financières
                </p>
              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <SituationCard
                title="Situation saine"
                count={statistics.healthyCount}
                total={reports.length}
                healthy
              />

              <SituationCard
                title="Entreprise à risque"
                count={statistics.riskCount}
                total={reports.length}
                healthy={false}
              />

            </div>

          </section>

          {/* =================================================
              DERNIER RAPPORT
          ================================================= */}

          {statistics.latest && (
            <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h2 className="text-base font-semibold">
                    Dernière analyse
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Rapport financier le plus récent
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    statistics.latest.financial_health ===
                    "healthy"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-red-400/10 text-red-300"
                  }`}
                >
                  {statistics.latest.financial_health ===
                  "healthy"
                    ? "Situation saine"
                    : "À risque"}
                </span>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <MetricBox
                  label="Score de santé"
                  value={`${normalizeScore(
                    statistics.latest.health_score
                  ).toFixed(1)}/100`}
                />

                <MetricBox
                  label="Probabilité de faillite"
                  value={`${(
                    normalizeProbability(
                      statistics.latest
                        .bankruptcy_probability
                    ) * 100
                  ).toFixed(2)}%`}
                />

                <MetricBox
                  label="Seuil de décision"
                  value={`${(
                    normalizeProbability(
                      statistics.latest
                        .decision_threshold
                    ) * 100
                  ).toFixed(0)}%`}
                />

              </div>

            </section>
          )}

          {/* =================================================
              FUTUR MONITORING PROJETS
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.015] p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10">
                <BarChart3 className="h-5 w-5 text-violet-300" />
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  Monitoring des projets
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Cette section accueillera prochainement
                  les statistiques liées aux projets :
                  avancement, risques, effort prévu,
                  effort réel, écarts, performance et
                  évolution des projets.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  <FutureBadge>
                    Avancement
                  </FutureBadge>

                  <FutureBadge>
                    Risques
                  </FutureBadge>

                  <FutureBadge>
                    Effort
                  </FutureBadge>

                  <FutureBadge>
                    Performance
                  </FutureBadge>

                  <FutureBadge>
                    Évolution
                  </FutureBadge>

                </div>
              </div>

            </div>

          </section>
        </>
      )}
    </div>
  );
}

/*
 * ============================================================
 * KPI CARD
 * ============================================================
 */

type KpiCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendType?: "score" | "probability";
};

function KpiCard({
  title,
  value,
  icon,
  trend,
  trendType,
}: KpiCardProps) {
  const hasTrend =
    typeof trend === "number" &&
    Number.isFinite(trend);

  const positive =
    trendType === "probability"
      ? trend! < 0
      : trend! > 0;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
          {icon}
        </div>

        {hasTrend && trend !== 0 && (
          <span
            className={`flex items-center gap-1 text-xs ${
              positive
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {positive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}

            {Math.abs(trend).toFixed(1)}
          </span>
        )}

      </div>

      <p className="mt-4 text-xs text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-white">
        {value}
      </p>

    </section>
  );
}

/*
 * ============================================================
 * SIMPLE LINE CHART
 * ============================================================
 *
 * Pas besoin de Recharts pour cette première version.
 * Le graphique utilise SVG.
 */

type ChartData = {
  id: number;
  date: string;
  [key: string]: string | number;
};

type SimpleLineChartProps = {
  data: ChartData[];
  valueKey: string;
  max: number;
  suffix: string;
};

function SimpleLineChart({
  data,
  valueKey,
  max,
  suffix,
}: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-600">
        Pas encore de données.
      </div>
    );
  }

  /*
   * Une seule analyse :
   * on affiche simplement le point.
   */
  if (data.length === 1) {
    const rawValue = Number(
      data[0][valueKey]
    );

    const value = Number.isFinite(rawValue)
      ? rawValue
      : 0;

    const percentage =
      Math.min(Math.max(value / max, 0), 1) *
      100;

    return (
      <div className="flex h-full flex-col items-center justify-center">

        <div className="relative flex h-40 w-full items-center justify-center">

          <div
            className="absolute h-3 w-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/30"
            style={{
              left: `${percentage}%`,
            }}
          />

          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.08]" />

        </div>

        <p className="text-2xl font-bold">
          {value.toFixed(1)}
          {suffix}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {data[0].date}
        </p>

      </div>
    );
  }

  const width = 800;
  const height = 260;

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const points = data.map((item, index) => {
    const rawValue = Number(
      item[valueKey]
    );

    const value = Number.isFinite(rawValue)
      ? Math.min(Math.max(rawValue, 0), max)
      : 0;

    const x =
      paddingLeft +
      (index /
        Math.max(data.length - 1, 1)) *
        chartWidth;

    const y =
      paddingTop +
      chartHeight -
      (value / max) * chartHeight;

    return {
      x,
      y,
      value,
      date: item.date,
    };
  });

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const gridValues = [
    max,
    max * 0.75,
    max * 0.5,
    max * 0.25,
    0,
  ];

  return (
    <div className="h-full w-full overflow-hidden">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >

        {/* GRILLE */}

        {gridValues.map((value) => {
          const y =
            paddingTop +
            chartHeight -
            (value / max) * chartHeight;

          return (
            <g key={value}>

              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-white/[0.06]"
                strokeWidth="1"
              />

              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-600 text-[11px]"
              >
                {value}
                {suffix}
              </text>

            </g>
          );
        })}

        {/* COURBE */}

        <path
          d={path}
          fill="none"
          stroke="currentColor"
          className="text-cyan-400"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* POINTS */}

        {points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-cyan-400"
          />
        ))}

        {/* DATES */}

        {points.map((point, index) => {
          /*
           * Pour éviter de surcharger le graphique,
           * on affiche au maximum quelques dates.
           */
          const shouldShow =
            data.length <= 6 ||
            index === 0 ||
            index === data.length - 1 ||
            index % Math.ceil(data.length / 5) === 0;

          if (!shouldShow) {
            return null;
          }

          return (
            <text
              key={`date-${index}`}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-600 text-[10px]"
            >
              {point.date}
            </text>
          );
        })}

      </svg>
    </div>
  );
}

/*
 * ============================================================
 * SITUATION CARD
 * ============================================================
 */

type SituationCardProps = {
  title: string;
  count: number;
  total: number;
  healthy: boolean;
};

function SituationCard({
  title,
  count,
  total,
  healthy,
}: SituationCardProps) {
  const percentage =
    total > 0
      ? (count / total) * 100
      : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              healthy
                ? "bg-emerald-400/10"
                : "bg-red-400/10"
            }`}
          >
            {healthy ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-300" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium">
              {title}
            </p>

            <p className="text-xs text-slate-600">
              {percentage.toFixed(1)}% des analyses
            </p>
          </div>

        </div>

        <span className="text-xl font-bold">
          {count}
        </span>

      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">

        <div
          className={`h-full rounded-full ${
            healthy
              ? "bg-emerald-400"
              : "bg-red-400"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/*
 * ============================================================
 * METRIC BOX
 * ============================================================
 */

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>

    </div>
  );
}

/*
 * ============================================================
 * FUTURE BADGE
 * ============================================================
 */

function FutureBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-500">
      {children}
    </span>
  );
}