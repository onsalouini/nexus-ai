// src/pages/chef/RiskPredictions.tsx
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "../../lib/api";
import { riskLabel } from "../../i18n/labels";
import RiskPredictionTester from "../../components/chef/RiskPredictionTester";

type RiskPrediction = {
  id: number;
  name: string;
  planned_effort: number;
  predicted_effort: number;
  risk_level: string | null;
  gap_percent: number | null;
};

export default function RiskPredictions() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"test" | "history">("test");
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab !== "history") return;

    api
      .get<RiskPrediction[]>("/projects/risk-predictions")
      .then((res) => setPredictions(res.data))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">
          {t("chef.sidebar.riskPrediction")}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {t("chef.riskPredictions.subtitle")}
        </p>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {[
          { key: "test", label: t("chef.riskPredictions.testTab") },
          { key: "history", label: t("chef.riskPredictions.historyTab") },
        ].map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key as "test" | "history")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === tabItem.key
                ? "border-cyan-400 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "test" && <RiskPredictionTester />}

      {tab === "history" && (
        <>
          {loading ? (
            <p className="text-sm text-slate-500">{t("common.loading")}</p>
          ) : predictions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
              <AlertTriangle className="h-8 w-8" />
              <p>{t("chef.riskPredictions.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {predictions.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/[0.07] bg-[#0B1628]/80 p-4"
                >
                  <h3 className="text-sm font-semibold text-white">
                    {p.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400">
                    {t("chef.riskPredictions.efforts", { planned: p.planned_effort, predicted: p.predicted_effort })}
                  </p>
                  {p.gap_percent !== null && (
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {p.gap_percent > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-red-300" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-emerald-300" />
                      )}
                      {t("chef.riskPredictions.gap", { value: p.gap_percent })}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {t("chef.riskPredictions.risk", { value: riskLabel(p.risk_level) })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}