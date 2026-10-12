import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth, getDashboardPath } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";

export default function SignInForm() {
  const { t } = useTranslation();
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Double authentification : challenge renvoyé par /login, puis saisie du code TOTP
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = challenge
        ? await verifyTwoFactor(challenge, code)
        : await login(email, password);

      if (result.twoFactorChallenge) {
        setChallenge(result.twoFactorChallenge);
        return;
      }

      const { needsCompanySetup, role } = result;

      if (needsCompanySetup) {
        navigate("/onboarding/entreprise", { replace: true });
        return;
      }

      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 429) {
        setError(t("auth.signin.tooManyAttempts"));
        return;
      }

      const message =
        err instanceof Error && "response" in err
          ? (err as {
              response?: {
                data?: {
                  message?: string;
                };
              };
            }).response?.data?.message
          : undefined;

      setError(message ?? t("auth.signin.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Sélecteur de langue */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {challenge && (
        <div>
          <p className="mb-3 text-sm text-slate-500">{t("auth.twoFactor.prompt")}</p>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("auth.twoFactor.code")}</label>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            dir="ltr"
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setCode("");
            }}
            className="mt-2 text-xs text-slate-500 hover:underline"
          >
            {t("auth.twoFactor.back")}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!challenge && (<>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("auth.email")}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.signin.emailPlaceholder")}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("auth.password")}
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.signin.passwordPlaceholder")}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      </>)}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60"
      >
        {loading ? t("auth.signin.connecting") : challenge ? t("auth.twoFactor.verify") : t("auth.loginButton")}
      </button>

      <p className="text-center text-sm text-slate-500">
        {t("auth.noAccount")}{" "}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
          {t("auth.signin.createCompanyAccount")}
        </Link>
      </p>
    </form>
  );
}