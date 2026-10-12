import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { riskLabel } from "../../i18n/labels";

type ModelStatus = {
  online: boolean;
};

// Libellés et descriptions : chef.models.features.<key>.label / .desc
const FEATURES = [
  "TeamExp",
  "ManagerExp",
  "Length",
  "Transactions",
  "Entities",
  "PointsNonAdjust",
  "Adjustment",
  "Language",
  "Density",
  "ExpWeightedComplexity",
  "VAF",
  "PointsAdjustedCalc",
];

const THRESHOLDS = [
  { level: "Faible", range: "≤ 10 %", className: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  { level: "Modéré", range: "10 % < · ≤ 35 %", className: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" },
  { level: "Élevé", range: "> 35 %", className: "text-orange-300 bg-orange-400/10 border-orange-400/20" },
];

export default function RiskModelsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ModelStatus>("/ai/model-status")
      .then((res) => setStatus(res.data))
      .catch(() => setStatus({ online: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              NEXUS AI
            </span>
            <span className="text-slate-700">/</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
              {t("chef.models.badge")}
            </span>
          </div>

          <h1 className="text-xl font-semibold text-white">{t("chef.sidebar.models")}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t("chef.models.subtitle")}
          </p>
        </div>

        <Link
          to="/dashboard/chef/risk-predictions"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:brightness-110"
        >
          {t("chef.riskPredictions.testTab")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* MODEL CARD */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0B1628]/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300">
              <BrainCircuit className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-base font-semibold text-white">
                Project Risk Predictor
              </h2>
              <p className="text-xs text-slate-500">
                {t("chef.models.description")}
              </p>
            </div>
          </div>

          {loading ? (
            <span className="text-xs text-slate-500">{t("chef.models.checking")}</span>
          ) : status?.online ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("chef.models.online")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300">
              <XCircle className="h-3.5 w-3.5" />
              {t("chef.models.offline")}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("chef.models.type")}</p>
            <p className="mt-1 text-sm text-white">{t("chef.models.typeValue")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("chef.models.output")}</p>
            <p className="mt-1 text-sm text-white">{t("chef.models.outputValue")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("chef.models.featuresLabel")}</p>
            <p className="mt-1 text-sm text-white">{t("chef.models.variableCount", { count: FEATURES.length })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("chef.models.service")}</p>
            <p className="mt-1 text-sm text-white">FastAPI (ai-services)</p>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-5 bg-cyan-400/60" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("chef.models.variables")}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((key) => ({ key, label: t(`chef.models.features.${key}.label`), desc: t(`chef.models.features.${key}.desc`) })).map((f) => (
            <div
              key={f.key}
              className="rounded-2xl border border-white/[0.07] bg-[#0B1628]/80 p-4"
            >
              <p className="text-sm font-semibold text-white">{f.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THRESHOLDS */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-5 bg-violet-400/60" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("chef.models.thresholds")}
          </h3>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-start text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">{t("chef.models.level")}</th>
                <th className="px-4 py-3">{t("chef.models.condition")}</th>
              </tr>
            </thead>
            <tbody>
              {THRESHOLDS.map((threshold) => (
                <tr key={threshold.level} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${threshold.className}`}>
                      {riskLabel(threshold.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t("chef.models.gapLabel")} {threshold.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}