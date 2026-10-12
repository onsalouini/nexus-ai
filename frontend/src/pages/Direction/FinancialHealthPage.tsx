
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import axios from "axios";
import { api } from "../../lib/api";
import i18n from "../../i18n";

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

type StoreReportResponse = {
  id: number;
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

// Libellés / descriptions : finance.fields.<key>.label / .desc
const fields = [
  { key: "current_ratio" },
  { key: "cash_total_assets" },
  { key: "roa_before_interest_depreciation" },
  { key: "operating_profit_rate" },
  { key: "debt_ratio" },
  { key: "net_worth_assets" },
  { key: "working_capital_total_assets" },
  { key: "net_income_total_assets" },
  { key: "total_asset_turnover" },
  { key: "retained_earnings_total_assets" },
  { key: "interest_coverage_ratio" },
  { key: "equity_liability" },
  { key: "cash_flow_total_assets" },
] as const;

// Noms des variables renvoyés par le modèle (même ordre que fields)
const MODEL_FEATURES = [
  "Current Ratio",
  "Cash/Total Assets",
  "ROA(C) before interest and depreciation before interest",
  "Operating Profit Rate",
  "Debt ratio %",
  "Net worth/Assets",
  "Working Capital to Total Assets",
  "Net Income to Total Assets",
  "Total Asset Turnover",
  "Retained Earnings to Total Assets",
  "Interest Coverage Ratio (Interest expense to EBIT)",
  "Equity to Liability",
  "Cash Flow to Total Assets",
];

// Libellé traduit d'une variable SHAP, ou son nom brut si inconnue
function featureLabel(feature: string): string {
  const index = MODEL_FEATURES.indexOf(feature.trim());
  return index >= 0 ? i18n.t(`finance.fields.${fields[index].key}.label`) : feature;
}

export default function FinancialHealthPage() {
  const { t } = useTranslation();
  const [form, setForm] =
    useState<FinancialData>(initialData);

  const [result, setResult] =
    useState<PredictionResult | null>(null);

  const [explanations, setExplanations] =
    useState<Explanation[]>([]);

  const [reportId, setReportId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [loadingExplanation, setLoadingExplanation] =
    useState(false);

  const [loadingPdf, setLoadingPdf] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /**
   * ============================================================
   * MODIFICATION DES CHAMPS
   * ============================================================
   */
  const handleChange = (
    key: keyof FinancialData,
    value: string
  ) => {
    const numericValue =
      value === "" ? 0 : Number(value);

    setForm((previous) => ({
      ...previous,
      [key]: Number.isFinite(numericValue)
        ? numericValue
        : 0,
    }));
  };

  /**
   * ============================================================
   * ANALYSE FINANCIÈRE
   * ============================================================
   *
   * 1. Prediction
   * 2. SHAP
   * 3. Sauvegarde
   */
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      setResult(null);
      setExplanations([]);
      setReportId(null);

      /**
       * --------------------------------------------------------
       * 1. PRÉDICTION ML
       * --------------------------------------------------------
       */
      const response = await api.post(
        "/financial-health/predict",
        form
      );

      const prediction =
        response.data?.data as PredictionResult;

      if (!prediction) {
        throw new Error(
          t("finance.invalidResponse")
        );
      }

      setResult(prediction);

      /**
       * --------------------------------------------------------
       * 2. EXPLICATION SHAP
       * --------------------------------------------------------
       */
      setLoadingExplanation(true);

      let shapExplanations: Explanation[] = [];

      try {
        const explanationResponse =
          await api.post(
            "/financial-health/explain",
            form
          );

        shapExplanations =
          explanationResponse.data?.data
            ?.explanations ?? [];

        if (!Array.isArray(shapExplanations)) {
          shapExplanations = [];
        }

        setExplanations(shapExplanations);
      } catch (shapError) {
        console.error(
          "SHAP error:",
          shapError
        );

        /*
         * La prédiction reste valide même si
         * l'explication SHAP échoue.
         */
        setExplanations([]);
      } finally {
        setLoadingExplanation(false);
      }

      /**
       * --------------------------------------------------------
       * 3. SAUVEGARDE DU RAPPORT
       * --------------------------------------------------------
       */
      const storeResponse =
        await api.post(
          "/financial-health/store",
          {
            financial_data: form,

            prediction:
              prediction.prediction,

            financial_health:
              prediction.financial_health,

            bankruptcy_probability:
              prediction.bankruptcy_probability,

            decision_threshold:
              prediction.decision_threshold,

            explanations:
              shapExplanations,
          }
        );

      const savedReport =
        storeResponse.data?.data as
          | StoreReportResponse
          | undefined;

      /**
       * Vérification importante :
       * Laravel doit retourner l'ID du rapport.
       */
      if (
        !savedReport ||
        typeof savedReport.id !== "number"
      ) {
        throw new Error(
          t("finance.missingReportId")
        );
      }

      setReportId(savedReport.id);

      setSuccessMessage(
        t("finance.saved", { id: savedReport.id })
      );

    } catch (err: unknown) {
      console.error(
        "Financial health error:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          t("finance.serviceError");

        setError(message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          t("finance.analysisError")
        );
      }
    } finally {
      setLoading(false);
      setLoadingExplanation(false);
    }
  };

  /**
   * ============================================================
   * TÉLÉCHARGEMENT PDF
   * ============================================================
   */
  const handleDownloadPdf = async () => {
    if (!reportId) {
      setError(
        t("finance.noReport")
      );

      return;
    }

    try {
      setLoadingPdf(true);
      setError("");

      const response = await api.get(
        `/financial-health/reports/${reportId}/download`,
        {
          responseType: "blob",

          headers: {
            Accept: "application/pdf",
          },
        }
      );

      /**
       * IMPORTANT :
       *
       * AxiosHeaders peut retourner :
       * string | number | boolean | string[] | ...
       *
       * Donc on convertit toujours en String
       * avant d'utiliser includes().
       */
      const contentType = String(
        response.headers["content-type"] ?? ""
      ).toLowerCase();

      /**
       * Vérification du type de fichier.
       */
      if (
        !contentType.includes(
          "application/pdf"
        )
      ) {
        /**
         * Laravel peut renvoyer une erreur JSON
         * sous forme de Blob.
         */
        let serverMessage =
          t("finance.invalidPdf");

        try {
          const text =
            await response.data.text();

          if (text) {
            const json =
              JSON.parse(text);

            if (json?.message) {
              serverMessage =
                json.message;
            }
          }
        } catch {
          /*
           * Impossible de parser la réponse.
           * On garde le message générique.
           */
        }

        throw new Error(serverMessage);
      }

      /**
       * Création du Blob PDF.
       */
      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      /**
       * Création d'une URL temporaire.
       */
      const url =
        window.URL.createObjectURL(blob);

      /**
       * Création du lien de téléchargement.
       */
      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `rapport-sante-financiere-${reportId}.pdf`;

      document.body.appendChild(link);

      link.click();

      /**
       * Nettoyage.
       */
      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (err: unknown) {
      console.error(
        "PDF download error:",
        err
      );

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            t("finance.downloadError")
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          t("finance.downloadError")
        );
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  /**
   * ============================================================
   * CALCUL DU SCORE
   * ============================================================
   */
  const probability =
    result?.bankruptcy_probability ?? 0;

  const healthScore = result
    ? Math.round(
        (1 - probability) * 100
      )
    : null;

  const isAtRisk =
    result?.financial_health ===
    "at_risk";

  return (
    <div className="min-h-full text-white">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">

            <BrainCircuit
              className="h-5 w-5 text-cyan-300"
            />

          </div>

          <div>

            <h1 className="text-2xl font-bold">
              {t("director.sidebar.analytics")}
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              {t("finance.subtitle")}
            </p>

          </div>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">

          <AlertTriangle
            className="h-5 w-5 shrink-0"
          />

          <span>
            {error}
          </span>

        </div>

      )}

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {successMessage && (

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">

          <CheckCircle2
            className="h-5 w-5 shrink-0"
          />

          <span>
            {successMessage}
          </span>

        </div>

      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* ====================================================
            FORMULAIRE
        ==================================================== */}

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

          <div className="mb-6">

            <div className="flex items-center gap-2">

              <Activity
                className="h-5 w-5 text-cyan-300"
              />

              <h2 className="text-lg font-semibold">
                {t("finance.indicators")}
              </h2>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              {t("finance.indicatorsHint")}
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {fields.map((field) => (

              <div key={field.key}>

                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {t(`finance.fields.${field.key}.label`)}
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
                  {t(`finance.fields.${field.key}.desc`)}
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
                <Loader2
                  className="h-4 w-4 animate-spin"
                />

                {t("chef.tester.running")}
              </>

            ) : (

              <>
                <BrainCircuit
                  className="h-4 w-4"
                />

                {t("finance.analyze")}
              </>

            )}

          </button>

          {/* ==================================================
              BOUTON PDF
          ================================================== */}

          {reportId && (

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loadingPdf}
              className="
                mt-3 flex w-full items-center
                justify-center gap-2 rounded-xl
                border border-white/[0.08]
                bg-white/[0.04]
                px-5 py-3.5
                text-sm font-semibold
                text-white
                transition
                hover:bg-white/[0.08]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {loadingPdf ? (

                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                  />

                  {t("finance.generatingPdf")}
                </>

              ) : (

                <>
                  <Download
                    className="h-4 w-4"
                  />

                  {t("finance.downloadPdf")}
                </>

              )}

            </button>

          )}

        </section>

        {/* ====================================================
            RESULTAT
        ==================================================== */}

        <div className="space-y-6">

          {/* ==================================================
              SCORE
          ================================================== */}

          <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

            <div className="pointer-events-none absolute -end-20 -top-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-400">
                    {t("finance.healthScore")}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {t("finance.computedByAi")}
                  </p>

                </div>

                <ShieldCheck
                  className="h-6 w-6 text-cyan-300"
                />

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
                        width: `${Math.min(
                          Math.max(
                            healthScore ?? 0,
                            0
                          ),
                          100
                        )}%`,
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

                        <AlertTriangle
                          className="h-3.5 w-3.5"
                        />

                      ) : (

                        <CheckCircle2
                          className="h-3.5 w-3.5"
                        />

                      )}

                      {isAtRisk ? t("finance.atRisk") : t("finance.healthy")}

                    </span>

                  </div>

                </>

              ) : (

                <div className="flex h-32 items-center justify-center text-sm text-slate-600">

                  {t("finance.runHint")}

                </div>

              )}

            </div>

          </section>

          {/* ==================================================
              PROBABILITE
          ================================================== */}

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

            <p className="text-sm text-slate-400">
              {t("finance.probability")}
            </p>

            <div className="mt-3 flex items-end justify-between">

              <span className="text-3xl font-bold text-white">

                {(probability * 100).toFixed(1)}%

              </span>

              {result && (

                <span className="text-xs text-slate-500">

                  {t("finance.threshold")}{" "}

                  {(
                    result.decision_threshold *
                    100
                  ).toFixed(0)}
                  %

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
                    Math.max(
                      probability * 100,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </section>

          {/* ==================================================
              SHAP
          ================================================== */}

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">

            <div className="mb-5 flex items-center gap-2">

              <TrendingUp
                className="h-5 w-5 text-violet-300"
              />

              <div>

                <h2 className="text-base font-semibold">
                  {t("finance.factors")}
                </h2>

                <p className="text-xs text-slate-500">
                  {t("finance.shap")}
                </p>

              </div>

            </div>

            {loadingExplanation ? (

              <div className="flex items-center gap-2 text-sm text-slate-500">

                <Loader2
                  className="h-4 w-4 animate-spin"
                />

                {t("finance.analyzingFactors")}

              </div>

            ) : explanations.length > 0 ? (

              <div className="space-y-3">

                {explanations
                  .slice(0, 6)
                  .map((item, index) => (

                    <div
                      key={`$                          {featureLabel(item.feature)}-${index}`}
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

                            <ArrowUp
                              className="h-4 w-4 text-red-400"
                            />

                          ) : (

                            <ArrowDown
                              className="h-4 w-4 text-emerald-400"
                            />

                          )}

                        </div>

                        <span className="truncate text-xs text-slate-300">
                          {featureLabel(item.feature)}
                        </span>

                      </div>

                      <span
                        className={`ms-3 text-xs font-semibold ${
                          item.impact ===
                          "increases_risk"
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >

                        {item.shap_value > 0
                          ? "+"
                          : ""}

                        {item.shap_value.toFixed(3)}

                      </span>

                    </div>

                  ))}

              </div>

            ) : (

              <p className="text-sm text-slate-600">

                {t("finance.factorsHint")}

              </p>

            )}

          </section>

        </div>

      </div>

    </div>
  );
}