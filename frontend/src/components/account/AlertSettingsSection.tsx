import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellRing, Mail, MonitorSmartphone, ShieldAlert } from "lucide-react";
import { workspaceApi } from "../../services/workspaceApi";
import { Field, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../ui-nexus/kit";
import { toast } from "../../lib/toast";

/*
| Paramètres d'alerte : emails des alertes critiques (Brevo), notifications du navigateur,
| et pour la direction les seuils de déclenchement (risque projet, probabilité de faillite).
*/
export default function AlertSettingsSection({
  emailAlerts,
  onEmailAlertsChange,
  isDirection,
}: {
  emailAlerts: boolean;
  onEmailAlertsChange: (value: boolean) => void;
  isDirection: boolean;
}) {
  const { t } = useTranslation();
  const supported = typeof Notification !== "undefined";
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(supported ? Notification.permission : "unsupported");
  const [thresholds, setThresholds] = useState<{ risk: number; bankruptcy: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDirection) return;
    workspaceApi.alerts().then((a) => setThresholds(a.thresholds)).catch(() => undefined);
  }, [isDirection]);

  async function toggleEmail() {
    const next = !emailAlerts;
    onEmailAlertsChange(next);
    try {
      await workspaceApi.savePreferences({ email_alerts: next });
      toast.success(t(next ? "alerts.emailOn" : "alerts.emailOff"));
    } catch (e) {
      onEmailAlertsChange(!next);
      toast.error(errMsg(e));
    }
  }

  async function enableDesktop() {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification("NEXUS AI", { body: t("alerts.desktopTest"), icon: "/nexus-logo.jpg" });
    }
  }

  async function saveThresholds() {
    if (!thresholds) return;
    setSaving(true);
    try {
      setThresholds(
        await workspaceApi.saveAlertThresholds({
          risk_alert_threshold: thresholds.risk,
          bankruptcy_alert_threshold: thresholds.bankruptcy,
        })
      );
      toast.success(t("alerts.thresholdsSaved"));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${cardCls} space-y-5 p-6`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/25 to-amber-500/20 text-rose-200">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-white">{t("alerts.settingsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-400">{t("alerts.settingsHint")}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-cyan-300" />
          <div>
            <p className="text-sm text-white">{t("alerts.email")}</p>
            <p className="text-xs text-slate-500">{t("alerts.emailHint")}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={emailAlerts}
          onClick={toggleEmail}
          className={`relative h-6 w-11 rounded-full transition ${emailAlerts ? "bg-gradient-to-r from-cyan-500 to-violet-500" : "bg-white/15"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${emailAlerts ? "start-[22px]" : "start-0.5"}`} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <MonitorSmartphone className="h-4 w-4 text-violet-300" />
          <div>
            <p className="text-sm text-white">{t("alerts.desktop")}</p>
            <p className="text-xs text-slate-500">{t(`alerts.desktopState.${permission}`)}</p>
          </div>
        </div>
        {permission === "default" && (
          <button type="button" className={btnGhost} onClick={enableDesktop}>
            {t("alerts.enableDesktop")}
          </button>
        )}
      </div>

      {isDirection && thresholds && (
        <div className="space-y-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-rose-100">
            <ShieldAlert className="h-4 w-4" />
            {t("alerts.thresholds")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("alerts.riskThreshold")}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={100}
                  className={inputCls}
                  value={thresholds.risk}
                  onChange={(e) => setThresholds({ ...thresholds, risk: Number(e.target.value) })}
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </Field>
            <Field label={t("alerts.bankruptcyThreshold")}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={95}
                  className={inputCls}
                  value={thresholds.bankruptcy}
                  onChange={(e) => setThresholds({ ...thresholds, bankruptcy: Number(e.target.value) })}
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </Field>
          </div>
          <p className="text-xs text-slate-500">{t("alerts.thresholdsHint")}</p>
          <button type="button" className={btnPrimary} onClick={saveThresholds} disabled={saving}>
            {saving ? t("common.saving") : t("alerts.saveThresholds")}
          </button>
        </div>
      )}
    </section>
  );
}
