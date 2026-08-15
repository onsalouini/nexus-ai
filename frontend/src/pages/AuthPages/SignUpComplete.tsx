import { FormEvent, ChangeEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth, getDashboardPath } from "../../context/AuthContext";
import { api } from "../../lib/api";

type Step = "info" | "verify" | "password";

const STEP_META: Record<Step, { badge: string; title: string }> = {
  info: { badge: "Étape 01", title: "Vos informations" },
  verify: { badge: "Étape 02", title: "Vérification de l'email" },
  password: { badge: "Étape 03", title: "Sécurisez votre compte" },
};

export default function SignUpComplete() {
  const { registerWithFiles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [avatar, setAvatar] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  }

  function extractMessage(err: unknown, fallback: string) {
    const message =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
    return message ?? fallback;
  }

  async function handleSubmitInfo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.first_name || !form.last_name || !form.email) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/send-code", { email: form.email, first_name: form.first_name });
      setStep("verify");
    } catch (err) {
      setError(extractMessage(err, "Impossible d'envoyer le code."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/verify-code", { email: form.email, code: verificationCode });
      setStep("password");
    } catch (err) {
      setError(extractMessage(err, "Code incorrect ou expiré."));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/send-code", { email: form.email, first_name: form.first_name });
    } catch (err) {
      setError(extractMessage(err, "Impossible de renvoyer le code."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.password_confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("invitation_token", token);
      if (avatar) fd.append("avatar", avatar);
      if (cv) fd.append("cv", cv);

      const { needsCompanySetup, role } = await registerWithFiles(fd);
      navigate(needsCompanySetup ? "/onboarding/entreprise" : getDashboardPath(role));
    } catch (err) {
      setError(extractMessage(err, "Impossible de créer le compte."));
    } finally {
      setLoading(false);
    }
  }

  const onSubmit =
    step === "info" ? handleSubmitInfo : step === "verify" ? handleSubmitVerify : handleSubmitPassword;

  const inputClass =
    "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-[12px] text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-[#22D3EE]/10";
  const labelClass = "mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] font-['Inter',sans-serif] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-[10%] h-[500px] w-[500px] rounded-full bg-[#22D3EE]/10 blur-[150px]" />
        <div className="absolute right-[-100px] top-[15%] h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/10 blur-[160px]" />
        <div className="absolute bottom-[-200px] left-[35%] h-[500px] w-[500px] rounded-full bg-[#3B82F6]/10 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)`,
            backgroundSize: "70px 70px",
          }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[560px]">
          {/* BRAND */}
          <div className="mb-8 flex items-center justify-between">
            <button type="button" onClick={() => navigate("/")} className="group flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] opacity-20 blur-xl transition duration-500 group-hover:opacity-40" />
                <img
                  src="/nexus-logo.jpg"
                  alt="NEXUS AI"
                  className="relative h-12 w-12 rounded-[15px] object-cover shadow-[0_0_25px_rgba(34,211,238,.12)] ring-1 ring-white/15"
                />
                <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-white/50" />
              </div>
              <div>
                <div className="font-['Space_Grotesk',sans-serif] text-[18px] font-bold tracking-tight text-white">
                  NEXUS <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">AI</span>
                </div>
                <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.22em] text-slate-600">
                  Enterprise Intelligence
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="hidden rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[11px] font-medium text-slate-400 backdrop-blur-xl transition hover:border-[#22D3EE]/20 hover:bg-white/[0.05] hover:text-white sm:block"
            >
              Déjà membre ? <span className="ml-1.5 text-[#67E8F9]">Se connecter</span>
            </button>
          </div>

          {/* HEADER */}
          <div className="mb-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-3 py-1.5 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#67E8F9]">
                Configuration du profil
              </span>
            </div>

            <h1 className="font-['Space_Grotesk',sans-serif] text-[34px] font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">
              Finalisez votre
              <br />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                espace NEXUS AI.
              </span>
            </h1>

            <p className="mt-4 max-w-[500px] text-[13px] leading-7 text-slate-500">
              Complétez vos informations pour accéder à votre espace intelligent et rejoindre votre organisation.
            </p>
          </div>

          {/* GLASS CARD */}
          <form
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#070D1C]/75 p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="pointer-events-none absolute left-[15%] right-[15%] top-0 h-16 bg-white/[0.035] blur-2xl" />

            {/* CARD HEADER */}
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#22D3EE]">{STEP_META[step].badge}</p>
                <h2 className="mt-1 text-[15px] font-semibold text-white">{STEP_META[step].title}</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 rounded-full transition-all ${step === "info" ? "w-5 bg-gradient-to-r from-[#22D3EE] to-[#3B82F6]" : "w-1.5 bg-white/20"}`} />
                <span className={`h-1.5 rounded-full transition-all ${step === "verify" ? "w-5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" : "w-1.5 bg-white/20"}`} />
                <span className={`h-1.5 rounded-full transition-all ${step === "password" ? "w-5 bg-[#8B5CF6]" : "w-1.5 bg-white/20"}`} />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                <span className="mt-0.5 text-[11px] text-red-400">●</span>
                <p className="text-[10px] leading-5 text-red-300">{error}</p>
              </div>
            )}

            {/* =========================== ETAPE 1 : INFO =========================== */}
            {step === "info" && (
              <>
                <div className="mb-7 flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 blur-md" />
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/[0.10] bg-white/[0.035]">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Aperçu" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl text-slate-600">✦</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-200">Photo de profil</p>
                    <p className="mt-1 text-[8px] leading-4 text-slate-600">Ajoutez une photo pour personnaliser votre profil.</p>
                    <label className="mt-2 inline-flex cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[9px] font-medium text-slate-400 transition hover:border-[#22D3EE]/25 hover:bg-white/[0.05] hover:text-[#67E8F9]">
                      Choisir une photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Prénom</label>
                    <input
                      required
                      value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                      placeholder="Votre prénom"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Nom</label>
                    <input
                      required
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      placeholder="Votre nom"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={labelClass}>Adresse email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="vous@entreprise.com"
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* =========================== ETAPE 2 : VERIFY =========================== */}
            {step === "verify" && (
              <div>
                <p className="mb-5 text-[11px] leading-5 text-slate-400">
                  Un code à 6 chiffres a été envoyé à <span className="text-white">{form.email}</span>. Saisissez-le ci-dessous.
                </p>
                <label className={labelClass}>Code de vérification</label>
                <input
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="h-14 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-center text-[22px] tracking-[0.5em] text-white outline-none placeholder:text-slate-700 focus:border-[#22D3EE]/40"
                />
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="mt-3 text-[10px] font-semibold text-[#67E8F9] hover:underline disabled:opacity-40"
                >
                  Renvoyer le code
                </button>
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="mt-3 ml-4 text-[10px] font-semibold text-slate-500 hover:underline"
                >
                  ← Modifier mon email
                </button>
              </div>
            )}

            {/* =========================== ETAPE 3 : PASSWORD =========================== */}
            {step === "password" && (
              <>
                <div>
                  <label className={labelClass}>Mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 8 caractères"
                    className={inputClass}
                  />
                </div>

                <div className="mt-4">
                  <label className={labelClass}>Confirmation du mot de passe</label>
                  <input
                    type="password"
                    required
                    value={form.password_confirmation}
                    onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                    placeholder="Répétez votre mot de passe"
                    className={inputClass}
                  />
                </div>

                <div className="mt-5">
                  <label className={labelClass}>
                    CV <span className="ml-2 normal-case tracking-normal text-slate-700">(PDF, optionnel)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-3 transition hover:border-[#22D3EE]/25 hover:bg-white/[0.035]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#67E8F9]">↑</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-slate-300">{cv ? cv.name : "Importer votre CV"}</p>
                      <p className="mt-0.5 text-[8px] text-slate-600">Format PDF uniquement</p>
                    </div>
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-7 flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] text-[11px] font-bold tracking-wide text-white shadow-[0_10px_35px_rgba(34,211,238,.12)] transition hover:shadow-[0_15px_45px_rgba(34,211,238,.20)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {loading
                  ? "PATIENTEZ..."
                  : step === "info"
                  ? "VÉRIFIER MON EMAIL"
                  : step === "verify"
                  ? "VALIDER LE CODE"
                  : "CRÉER MON COMPTE"}
              </span>
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-center">
              <span className="text-[9px] text-[#22D3EE]">◉</span>
              <p className="text-[8px] leading-5 text-slate-600">
                Vos données sont protégées et votre accès est sécurisé par NEXUS AI.
              </p>
            </div>
          </form>

          <div className="mt-6 text-center sm:hidden">
            <button type="button" onClick={() => navigate("/signin")} className="text-[10px] text-slate-500 transition hover:text-white">
              Déjà membre ? <span className="ml-1 text-[#67E8F9]">Se connecter</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}