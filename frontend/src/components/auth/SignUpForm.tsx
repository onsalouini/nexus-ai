import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import LanguageSwitcher from "../common/LanguageSwitcher";

type Step = "info" | "verify" | "password";

export default function SignUpForm() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("info");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value,
      }));
  }

  function extractMessage(err: unknown, fallback: string) {
    if (err && typeof err === "object" && "response" in err) {
      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string[]>;
            };
          };
        }
      ).response;

      if (response?.data?.message) {
        return response.data.message;
      }

      if (response?.data?.errors) {
        const firstError = Object.values(response.data.errors)[0]?.[0];
        if (firstError) {
          return firstError;
        }
      }
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return fallback;
  }

  // =========================================================
  // ÉTAPE 1 : informations + envoi du code
  // =========================================================

  async function handleSubmitInfo(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.first_name || !form.last_name || !form.email) {
      setError(t("auth.signup.step1.fillAllFields"));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/send-code", {
        email: form.email,
        first_name: form.first_name,
      });

      setStep("verify");
    } catch (err) {
      setError(extractMessage(err, t("auth.signup.step1.sendCodeError")));
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // ÉTAPE 2 : vérification du code
  // =========================================================

  async function handleSubmitVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError(t("auth.signup.step2.enterSixDigits"));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/verify-code", {
        email: form.email,
        code: verificationCode,
      });

      setStep("password");
    } catch (err) {
      setError(extractMessage(err, t("auth.signup.step2.invalidCode")));
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // Renvoyer le code
  // =========================================================

  async function handleResendCode() {
    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/send-code", {
        email: form.email,
        first_name: form.first_name,
      });

      setVerificationCode("");
    } catch (err) {
      setError(extractMessage(err, t("auth.signup.step2.resendError")));
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // ÉTAPE 3 : création du compte
  // =========================================================

  async function handleSubmitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.password_confirmation) {
      setError(t("auth.signup.step3.passwordMismatch"));
      return;
    }

    if (form.password.length < 8) {
      setError(t("auth.signup.step3.passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate("/onboarding/entreprise");
    } catch (err) {
      setError(extractMessage(err, t("auth.signup.step3.createAccountError")));
    } finally {
      setLoading(false);
    }
  }

  const onSubmit =
    step === "info"
      ? handleSubmitInfo
      : step === "verify"
      ? handleSubmitVerify
      : handleSubmitPassword;

  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Sélecteur de langue */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-center gap-2 pb-2">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === "info" ? "w-8 bg-indigo-600" : "w-2 bg-indigo-200"}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === "verify" ? "w-8 bg-indigo-600" : "w-2 bg-indigo-200"}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === "password" ? "w-8 bg-indigo-600" : "w-2 bg-indigo-200"}`} />
      </div>

      {/* ÉTAPE 1 : INFORMATIONS */}
      {step === "info" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t("auth.signup.step1.firstName")}
              </label>
              <input
                required
                value={form.first_name}
                onChange={update("first_name")}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t("auth.signup.step1.lastName")}
              </label>
              <input
                required
                value={form.last_name}
                onChange={update("last_name")}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.signup.step1.professionalEmail")}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="nom@entreprise.com"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </>
      )}

      {/* ÉTAPE 2 : VÉRIFICATION EMAIL */}
      {step === "verify" && (
        <>
          <div className="rounded-lg bg-indigo-50 px-4 py-4 text-center">
            <p className="text-sm text-slate-600">
              {t("auth.signup.step2.codeSentTo")}
            </p>
            <p className="mt-1 font-semibold text-indigo-600">{form.email}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.signup.step2.codeLabel")}
            </label>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-xl font-semibold tracking-[0.5em] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setVerificationCode("");
                setStep("info");
              }}
              className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
            >
              {t("auth.signup.step2.editEmail")}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm font-semibold text-indigo-600 hover:underline disabled:opacity-50"
            >
              {t("auth.signup.step2.resendCode")}
            </button>
          </div>
        </>
      )}

      {/* ÉTAPE 3 : MOT DE PASSE */}
      {step === "password" && (
        <>
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {t("auth.signup.step3.emailVerified")}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.password")}
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              placeholder={t("auth.signup.step3.passwordPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.signup.step3.confirmPassword")}
            </label>
            <input
              type="password"
              required
              value={form.password_confirmation}
              onChange={update("password_confirmation")}
              placeholder={t("auth.signup.step3.confirmPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </>
      )}

      {/* BOUTON PRINCIPAL */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60"
      >
        {loading
          ? t("auth.signup.pleaseWait")
          : step === "info"
          ? t("auth.signup.step1.verifyButton")
          : step === "verify"
          ? t("auth.signup.step2.validateButton")
          : t("auth.signup.step3.createAccountButton")}
      </button>

      {/* CONNEXION */}
      <p className="text-center text-sm text-slate-500">
        {t("auth.signup.alreadyAccount")}{" "}
        <Link to="/signin" className="font-semibold text-indigo-600 hover:underline">
          {t("auth.loginButton")}
        </Link>
      </p>

    </form>
  );
}