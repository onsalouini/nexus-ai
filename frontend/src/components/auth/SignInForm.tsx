import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth, getDashboardPath } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";

export default function SignInForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { needsCompanySetup, role } = await login(email, password);

      if (needsCompanySetup) {
        navigate("/onboarding/entreprise", { replace: true });
        return;
      }

      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
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

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60"
      >
        {loading ? t("auth.signin.connecting") : t("auth.loginButton")}
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