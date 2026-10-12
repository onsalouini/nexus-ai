import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth, type NexusUser } from "../../context/AuthContext";
import { workspaceApi } from "../../services/workspaceApi";
import { Field, btnDanger, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../ui-nexus/kit";
import { toast } from "../../lib/toast";

/* Double authentification TOTP (Google Authenticator, Microsoft Authenticator, Authy…) */
export default function TwoFactorSection() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const enabled = Boolean(user?.two_factor_enabled);
  const recommended = user?.role === "direction" && !enabled;

  async function run(action: () => Promise<{ user?: NexusUser } | void>, success: string) {
    setBusy(true);
    try {
      const result = await action();
      if (result && "user" in result && result.user) setUser(result.user);
      toast.success(success);
      setSetup(null);
      setCode("");
      setPassword("");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setBusy(true);
    try {
      setSetup(await workspaceApi.setup2fa());
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${cardCls} space-y-4 p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            {enabled ? <ShieldCheck className="h-5 w-5 text-emerald-400" /> : <ShieldAlert className="h-5 w-5 text-amber-300" />}
            {t("twoFactor.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{t("twoFactor.subtitle")}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            enabled ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
          }`}
        >
          {enabled ? t("twoFactor.enabled") : t("twoFactor.disabled")}
        </span>
      </div>

      {recommended && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-200">
          {t("twoFactor.recommended")}
        </p>
      )}

      {!enabled && !setup && (
        <button className={btnPrimary} onClick={start} disabled={busy}>
          {t("twoFactor.enable")}
        </button>
      )}

      {!enabled && setup && (
        <div className="grid gap-5 md:grid-cols-[auto_1fr]">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={setup.otpauth_uri} size={160} />
          </div>
          <div className="space-y-3">
            <p className="text-sm text-slate-300">{t("twoFactor.scan")}</p>
            <p className="text-xs text-slate-500">{t("twoFactor.manual")}</p>
            <code className="block break-all rounded-lg bg-white/[0.05] px-3 py-2 font-mono text-sm text-cyan-200" dir="ltr">
              {setup.secret.match(/.{1,4}/g)?.join(" ")}
            </code>
            <Field label={t("twoFactor.code")}>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                dir="ltr"
                className={`${inputCls} !w-40 text-center tracking-[0.3em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <div className="flex gap-2">
              <button
                className={btnPrimary}
                disabled={busy || code.length !== 6}
                onClick={() => run(() => workspaceApi.enable2fa(code), t("twoFactor.enabledToast"))}
              >
                {t("twoFactor.confirm")}
              </button>
              <button className={btnGhost} onClick={() => setSetup(null)}>{t("common.cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {enabled && (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={t("settings.currentPassword")}>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label={t("twoFactor.code")}>
            <input
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <button
            className={btnDanger}
            disabled={busy || !password || code.length !== 6}
            onClick={() => run(() => workspaceApi.disable2fa(password, code), t("twoFactor.disabledToast"))}
          >
            {t("twoFactor.disable")}
          </button>
        </div>
      )}
    </section>
  );
}
