import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronRight, TrendingDown, X } from "lucide-react";
import { workspaceApi, type RiskAlerts } from "../../services/workspaceApi";
import { riskLabel } from "../../i18n/labels";

/*
| Bandeau d'alerte en haut des tableaux de bord (direction, chef) :
| projets dont le risque dépasse le seuil de l'entreprise, risque de faillite élevé.
*/
export default function RiskAlertBanner({ role }: { role: "direction" | "chef_de_projet" }) {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<RiskAlerts | null>(null);
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem("nexus_alert_banner_hidden") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    workspaceApi.alerts().then(setAlerts).catch(() => undefined);
  }, []);

  if (hidden || !alerts) return null;
  const bankruptcy = alerts.bankruptcy?.alert ? alerts.bankruptcy : null;
  if (alerts.projects.length === 0 && !bankruptcy) return null;

  function dismiss() {
    setHidden(true);
    try {
      sessionStorage.setItem("nexus_alert_banner_hidden", "1");
    } catch {
      /* stockage indisponible : masqué jusqu'au rechargement */
    }
  }

  const projectLink = (id: number) =>
    role === "direction" ? `/dashboard/direction/projects/${id}` : "/dashboard/chef/risk-predictions";

  return (
    <div
      role="alert"
      className="relative mb-6 overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-600/15 via-rose-600/10 to-amber-500/10 p-4 shadow-[0_0_40px_-12px_rgba(239,68,68,0.45)] sm:p-5"
    >
      <div className="pointer-events-none absolute -start-10 -top-10 h-32 w-32 rounded-full bg-red-500/20 blur-3xl" />
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("common.close")}
        className="absolute end-3 top-3 rounded-lg p-1 text-red-200/70 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-200">
          <span className="absolute inset-0 animate-ping rounded-xl bg-red-500/20" />
          <AlertTriangle className="relative h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1 space-y-3 pe-6">
          <div>
            <p className="font-semibold text-white">{t("alerts.bannerTitle")}</p>
            <p className="text-sm text-red-100/70">
              {t("alerts.bannerHint", { risk: alerts.thresholds.risk, bankruptcy: alerts.thresholds.bankruptcy })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {bankruptcy && (
              <Link
                to="/dashboard/direction/analytics"
                className="group flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm text-white transition hover:bg-red-500/30"
              >
                <TrendingDown className="h-4 w-4 text-red-200" />
                {t("alerts.bankruptcyChip", { probability: bankruptcy.probability })}
                <ChevronRight className="h-4 w-4 opacity-60 transition group-hover:translate-x-0.5 rtl:rotate-180" />
              </Link>
            )}
            {alerts.projects.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                to={projectLink(p.id)}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 transition hover:border-red-400/40"
              >
                <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]" />
                <span className="max-w-[180px] truncate">{p.name}</span>
                <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-red-200">
                  {p.risk_score !== null ? `+${p.risk_score} %` : riskLabel(p.risk_level ?? "")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
