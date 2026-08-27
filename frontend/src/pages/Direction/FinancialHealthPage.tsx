import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { api } from "../../lib/api";
import axios from "axios";
type FinancialData = {
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

type PredictionResult = {
  prediction: number;
  financial_health: "healthy" | "at_risk";
  bankruptcy_probability: number;
  decision_threshold: number;
};

type Explanation = {
  feature: string;
  shap_value: number;
  impact: "increases_risk" | "decreases_risk";
};

const initialData: FinancialData = {
  current_ratio: 0,
  cash_total_assets: 0,
  roa_before_interest_depreciation: 0,
  operating_profit_rate: 0,
  debt_ratio: 0,
  net_worth_assets: 0,
  working_capital_total_assets: 0,
  net_income_total_assets: 0,
  total_asset_turnover: 0,
  retained_earnings_total_assets: 0,
  interest_coverage_ratio: 0,
  equity_liability: 0,
  cash_flow_total_assets: 0,
};

const fields = [
  {
    key: "current_ratio",
    label: "Current Ratio",
    description: "Capacité à couvrir les dettes à court terme",
  },
  {
    key: "cash_total_assets",
    label: "Cash / Total Assets",
    description: "Part des actifs détenue sous forme de liquidités",
  },
  {
    key: "roa_before_interest_depreciation",
    label: "ROA avant intérêts et dépréciation",
    description: "Rentabilité des actifs",
  },
  {
    key: "operating_profit_rate",
    label: "Operating Profit Rate",
    description: "Taux de profit opérationnel",
  },
  {
    key: "debt_ratio",
    label: "Debt Ratio",
    description: "Niveau d'endettement",
  },
  {
    key: "net_worth_assets",
    label: "Net Worth / Assets",
    description: "Poids des capitaux propres",
  },
  {
    key: "working_capital_total_assets",
    label: "Working Capital / Assets",
    description: "Poids du fonds de roulement",
  },
  {
    key: "net_income_total_assets",
    label: "Net Income / Assets",
    description: "Rentabilité nette des actifs",
  },
  {
    key: "total_asset_turnover",
    label: "Total Asset Turnover",
    description: "Efficacité d'utilisation des actifs",
  },
  {
    key: "retained_earnings_total_assets",
    label: "Retained Earnings / Assets",
    description: "Bénéfices conservés par rapport aux actifs",
  },
  {
    key: "interest_coverage_ratio",
    label: "Interest Coverage Ratio",
    description: "Capacité à couvrir les intérêts",
  },
  {
    key: "equity_liability",
    label: "Equity / Liability",
    description: "Rapport capitaux propres / passifs",
  },
  {
    key: "cash_flow_total_assets",
    label: "Cash Flow / Assets",
    description: "Flux de trésorerie généré par les actifs",
  },
] as const;

export default function FinancialHealthPage() {
  const [form, setForm] = useState<FinancialData>(initialData);

  const [result, setResult] = useState<PredictionResult | null>(null);

  const [explanations, setExplanations] = useState<Explanation[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    key: keyof FinancialData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: Number(value),
    }));
  };

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);
      setExplanations([]);

      const response = await api.post(
        "/financial-health/predict",
        form
      );

      const prediction = response.data.data;

      setResult(prediction);

      // Demander automatiquement l'explication SHAP
      setLoadingExplanation(true);

      const explanationResponse = await api.post(
        "/financial-health/explain",
        form
      );

      setExplanations(
        explanationResponse.data.data.explanations ?? []
      );
    } catch (err: unknown) {
  console.error("Financial health error:", err);

  if (axios.isAxiosError(err)) {
    setError(
      err.response?.data?.message ||
        err.response?.data?.detail ||
        "Impossible de contacter le service de santé financière."
    );
  } else {
    setError(
      "Une erreur inattendue est survenue pendant l'analyse."
    );
  }
} finally {
      setLoading(false);
      setLoadingExplanation(false);
    }
  };

  const probability =
    result?.bankruptcy_probability ?? 0;

  const healthScore = result
    ? Math.round((1 - probability) * 100)
    : null;

  const isAtRisk =
    result?.financial_health === "at_risk";

  return (
    <div className="min-h-full text-white">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <BrainCircuit className="h-5 w-5 text-cyan-300" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Santé financière
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Analyse prédictive de la santé financière de votre entreprise
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* FORMULAIRE */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-300" />

              <h2 className="text-lg font-semibold">
                Indicateurs financiers
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Entrez les indicateurs utilisés par le modèle ML.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {field.label}
                </label>

                <input
                  type="number"
                  step="any"
                  value={form[field.key]}
                  onChange={(e) =>
                    handleChange(
                      field.key,
                      e.target.value
                    )
                  }
                  className="
                    w-full rounded-xl
                    border border-white/[0.08]
                    bg-[#020817]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    transition
                    focus:border-cyan-400/40
                    focus:ring-2
                    focus:ring-cyan-400/10
                  "
                />

                <p className="mt-1 text-[11px] text-slate-600">
                  {field.description}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="
              mt-7 flex w-full items-center
              justify-center gap-2 rounded-xl
              bg-gradient-to-r
              from-cyan-400
              via-blue-500
              to-violet-500
              px-5 py-3.5
              text-sm font-semibold text-white
              shadow-lg shadow-cyan-500/10
              transition
              hover:scale-[1.01]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <BrainCircuit className="h-4 w-4" />
                Analyser la santé financière
              </>
            )}
          </button>
        </section>

        {/* RESULTAT */}
        <div className="space-y-6">
          {/* SCORE */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Score de santé
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Calculé par le modèle IA
                  </p>
                </div>

                <ShieldCheck className="h-6 w-6 text-cyan-300" />
              </div>

              {result ? (
                <>
                  <div className="flex items-end gap-2">
                    <span
                      className={`text-5xl font-bold ${
                        isAtRisk
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {healthScore}
                    </span>

                    <span className="mb-2 text-lg text-slate-500">
                      / 100
                    </span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAtRisk
                          ? "bg-red-400"
                          : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${healthScore}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        isAtRisk
                          ? "bg-red-400/10 text-red-300"
                          : "bg-emerald-400/10 text-emerald-300"
                      }`}
                    >
                      {isAtRisk ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}

                      {isAtRisk
                        ? "Entreprise à risque"
                        : "Situation financière saine"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-slate-600">
                  Lancez une analyse pour obtenir le score.
                </div>
              )}
            </div>
          </section>

          {/* PROBABILITE */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <p className="text-sm text-slate-400">
              Probabilité de faillite
            </p>

            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-white">
                {(probability * 100).toFixed(1)}%
              </span>

              {result && (
                <span className="text-xs text-slate-500">
                  Seuil :{" "}
                  {(result.decision_threshold * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${
                  probability >=
                  (result?.decision_threshold ?? 1)
                    ? "bg-red-400"
                    : "bg-cyan-400"
                }`}
                style={{
                  width: `${Math.min(
                    probability * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </section>

          {/* SHAP */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-300" />

              <div>
                <h2 className="text-base font-semibold">
                  Facteurs explicatifs
                </h2>

                <p className="text-xs text-slate-500">
                  Analyse SHAP du modèle
                </p>
              </div>
            </div>

            {loadingExplanation ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse des facteurs...
              </div>
            ) : explanations.length > 0 ? (
              <div className="space-y-3">
                {explanations.slice(0, 6).map((item) => (
                  <div
                    key={item.feature}
                    className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          item.impact ===
                          "increases_risk"
                            ? "bg-red-400/10"
                            : "bg-emerald-400/10"
                        }`}
                      >
                        {item.impact ===
                        "increases_risk" ? (
                          <ArrowUp className="h-4 w-4 text-red-400" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-emerald-400" />
                        )}
                      </div>

                      <span className="truncate text-xs text-slate-300">
                        {item.feature}
                      </span>
                    </div>

                    <span
                      className={`ml-3 text-xs font-semibold ${
                        item.impact ===
                        "increases_risk"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {item.shap_value > 0 ? "+" : ""}
                      {item.shap_value.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Les facteurs explicatifs apparaîtront après
                l'analyse.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}