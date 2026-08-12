import { FormEvent, ChangeEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function SignUpComplete() {
  const { registerWithFiles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

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

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.password_confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v);
      });

      fd.append("invitation_token", token);

      if (avatar) {
        fd.append("avatar", avatar);
      }

      if (cv) {
        fd.append("cv", cv);
      }

      const { needsCompanySetup } = await registerWithFiles(fd);

      navigate(
        needsCompanySetup
          ? "/onboarding/entreprise"
          : "/dashboard"
      );
    } catch (err) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (
              err as {
                response?: {
                  data?: {
                    message?: string;
                  };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(message ?? "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] font-['Inter',sans-serif] text-white">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none fixed inset-0">

        {/* Cyan glow */}
        <div className="absolute -left-40 top-[10%] h-[500px] w-[500px] rounded-full bg-[#22D3EE]/10 blur-[150px]" />

        {/* Violet glow */}
        <div className="absolute right-[-100px] top-[15%] h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/10 blur-[160px]" />

        {/* Blue glow */}
        <div className="absolute bottom-[-200px] left-[35%] h-[500px] w-[500px] rounded-full bg-[#3B82F6]/10 blur-[150px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)
            `,
            backgroundSize: "70px 70px",
          }}
        />
      </div>


      {/* =========================================================
          MAIN
      ========================================================= */}

      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-[560px]">

          {/* =====================================================
              BRAND
          ===================================================== */}

          <div className="mb-8 flex items-center justify-between">

            <button
              type="button"
              onClick={() => navigate("/")}
              className="group flex items-center gap-3"
            >

              {/* Logo */}
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
                  NEXUS{" "}
                  <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                    AI
                  </span>
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
              Déjà membre ?
              <span className="ml-1.5 text-[#67E8F9]">
                Se connecter
              </span>
            </button>

          </div>


          {/* =====================================================
              HEADER
          ===================================================== */}

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
              Complétez vos informations pour accéder à votre
              espace intelligent et rejoindre votre organisation.
            </p>

          </div>


          {/* =====================================================
              GLASS CARD
          ===================================================== */}

          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#070D1C]/75 p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-8"
          >

            {/* Top reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="pointer-events-none absolute left-[15%] right-[15%] top-0 h-16 bg-white/[0.035] blur-2xl" />


            {/* =================================================
                CARD HEADER
            ================================================= */}

            <div className="mb-7 flex items-center justify-between">

              <div>

                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#22D3EE]">
                  Étape 02
                </p>

                <h2 className="mt-1 text-[15px] font-semibold text-white">
                  Informations personnelles
                </h2>

              </div>


              <div className="flex items-center gap-1.5">

                <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#3B82F6]" />

                <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" />

                <span className="h-1.5 w-1.5 rounded-full bg-white/10" />

              </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">

                <span className="mt-0.5 text-[11px] text-red-400">
                  ●
                </span>

                <p className="text-[10px] leading-5 text-red-300">
                  {error}
                </p>

              </div>
            )}


            {/* =================================================
                AVATAR
            ================================================= */}

            <div className="mb-7 flex items-center gap-4">

              <div className="relative">

                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 blur-md" />

                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/[0.10] bg-white/[0.035]">

                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Aperçu"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl text-slate-600">
                      ✦
                    </span>
                  )}

                </div>

              </div>


              <div>

                <p className="text-[11px] font-medium text-slate-200">
                  Photo de profil
                </p>

                <p className="mt-1 text-[8px] leading-4 text-slate-600">
                  Ajoutez une photo pour personnaliser votre profil.
                </p>

                <label className="mt-2 inline-flex cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[9px] font-medium text-slate-400 transition hover:border-[#22D3EE]/25 hover:bg-white/[0.05] hover:text-[#67E8F9]">

                  Choisir une photo

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                </label>

              </div>

            </div>


            {/* =================================================
                FIRST NAME / LAST NAME
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* First name */}
              <div>

                <label className="mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                  Prénom
                </label>

                <input
                  required
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder="Votre prénom"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    px-4
                    text-[12px]
                    text-white
                    outline-none
                    placeholder:text-slate-700
                    transition
                    focus:border-[#22D3EE]/40
                    focus:bg-white/[0.04]
                    focus:ring-1
                    focus:ring-[#22D3EE]/10
                  "
                />

              </div>


              {/* Last name */}
              <div>

                <label className="mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                  Nom
                </label>

                <input
                  required
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      last_name: e.target.value,
                    }))
                  }
                  placeholder="Votre nom"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    px-4
                    text-[12px]
                    text-white
                    outline-none
                    placeholder:text-slate-700
                    transition
                    focus:border-[#22D3EE]/40
                    focus:bg-white/[0.04]
                    focus:ring-1
                    focus:ring-[#22D3EE]/10
                  "
                />

              </div>

            </div>


            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="mt-4">

              <label className="mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                Adresse email
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    email: e.target.value,
                  }))
                }
                placeholder="vous@entreprise.com"
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-white/[0.025]
                  px-4
                  text-[12px]
                  text-white
                  outline-none
                  placeholder:text-slate-700
                  transition
                  focus:border-[#22D3EE]/40
                  focus:bg-white/[0.04]
                  focus:ring-1
                  focus:ring-[#22D3EE]/10
                "
              />

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="mt-4">

              <label className="mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                Mot de passe
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    password: e.target.value,
                  }))
                }
                placeholder="Minimum 8 caractères"
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-white/[0.025]
                  px-4
                  text-[12px]
                  text-white
                  outline-none
                  placeholder:text-slate-700
                  transition
                  focus:border-[#22D3EE]/40
                  focus:bg-white/[0.04]
                  focus:ring-1
                  focus:ring-[#22D3EE]/10
                "
              />

            </div>


            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <div className="mt-4">

              <label className="mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                Confirmation du mot de passe
              </label>

              <input
                type="password"
                required
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    password_confirmation: e.target.value,
                  }))
                }
                placeholder="Répétez votre mot de passe"
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-white/[0.025]
                  px-4
                  text-[12px]
                  text-white
                  outline-none
                  placeholder:text-slate-700
                  transition
                  focus:border-[#22D3EE]/40
                  focus:bg-white/[0.04]
                  focus:ring-1
                  focus:ring-[#22D3EE]/10
                "
              />

            </div>


            {/* =================================================
                CV
            ================================================= */}

            <div className="mt-5">

              <label className="mb-2 block font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                CV
                <span className="ml-2 normal-case tracking-normal text-slate-700">
                  (PDF, optionnel)
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-3 transition hover:border-[#22D3EE]/25 hover:bg-white/[0.035]">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#67E8F9]">
                  ↑
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-[10px] font-medium text-slate-300">
                    {cv ? cv.name : "Importer votre CV"}
                  </p>

                  <p className="mt-0.5 text-[8px] text-slate-600">
                    Format PDF uniquement
                  </p>

                </div>

                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    setCv(e.target.files?.[0] ?? null)
                  }
                />

              </label>

            </div>


            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="
                group
                relative
                mt-7
                flex
                h-12
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-gradient-to-r
                from-[#22D3EE]
                via-[#3B82F6]
                to-[#8B5CF6]
                text-[11px]
                font-bold
                tracking-wide
                text-white
                shadow-[0_10px_35px_rgba(34,211,238,.12)]
                transition
                hover:shadow-[0_15px_45px_rgba(34,211,238,.20)]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {/* shine */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="relative">
                {loading ? "CRÉATION EN COURS..." : "CRÉER MON COMPTE"}
              </span>

            </button>


            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="mt-5 flex items-center justify-center gap-2 text-center">

              <span className="text-[9px] text-[#22D3EE]">
                ◉
              </span>

              <p className="text-[8px] leading-5 text-slate-600">
                Vos données sont protégées et votre accès est
                sécurisé par NEXUS AI.
              </p>

            </div>

          </form>


          {/* =====================================================
              MOBILE LOGIN
          ===================================================== */}

          <div className="mt-6 text-center sm:hidden">

            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="text-[10px] text-slate-500 transition hover:text-white"
            >
              Déjà membre ?
              <span className="ml-1 text-[#67E8F9]">
                Se connecter
              </span>
            </button>

          </div>

        </div>

      </main>


      {/* =========================================================
          FLOATING AI GUIDE
      ========================================================= */}

      <div className="group fixed bottom-6 right-6 z-50">

        {/* Hint */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-16
            right-0
            w-[285px]
            translate-y-3
            scale-95
            opacity-0
            origin-bottom-right
            transition-all
            duration-300
            ease-out
            group-hover:pointer-events-auto
            group-hover:translate-y-0
            group-hover:scale-100
            group-hover:opacity-100
          "
        >

          <div className="absolute -inset-3 rounded-[25px] bg-gradient-to-r from-[#22D3EE]/10 to-[#8B5CF6]/10 blur-xl" />

          <div className="relative overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#071021]/95 p-4 shadow-[0_25px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl">

            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

            <div className="relative flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/10 bg-gradient-to-br from-[#22D3EE]/10 to-[#8B5CF6]/10 text-[#67E8F9]">
                ✦
              </div>

              <div>

                <p className="text-[10px] font-semibold text-white">
                  Comment fonctionne NEXUS ?
                </p>

                <p className="mt-1 text-[8px] leading-5 text-slate-500">
                  Complétez votre profil pour accéder à votre espace.
                </p>

              </div>

            </div>


            <div className="mt-4 space-y-3">

              {[
                {
                  number: "01",
                  title: "Créer votre compte",
                  color: "#22D3EE",
                },
                {
                  number: "02",
                  title: "Compléter votre profil",
                  color: "#3B82F6",
                },
                {
                  number: "03",
                  title: "Rejoindre votre espace",
                  color: "#8B5CF6",
                },
              ].map((step) => (

                <div
                  key={step.number}
                  className="flex items-center gap-3"
                >

                  <div
                    className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[6px] font-bold"
                    style={{
                      borderColor: `${step.color}35`,
                      backgroundColor: `${step.color}12`,
                      color: step.color,
                    }}
                  >
                    {step.number}
                  </div>

                  <p className="text-[8px] font-semibold text-slate-300">
                    {step.title}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </div>


        {/* Button */}
        <button
          type="button"
          aria-label="Afficher le guide NEXUS AI"
          className="
            relative
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-white/[0.12]
            bg-[#071021]/80
            text-[#67E8F9]
            shadow-[0_12px_40px_rgba(0,0,0,.45)]
            backdrop-blur-2xl
            transition-all
            duration-300
            group-hover:-translate-y-1
            group-hover:border-[#22D3EE]/30
            group-hover:bg-[#0A172A]/90
            group-hover:shadow-[0_15px_45px_rgba(34,211,238,.12)]
          "
        >

          <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <span className="absolute inset-0 rounded-2xl bg-[#22D3EE]/0 blur-xl transition group-hover:bg-[#22D3EE]/10" />

          <span className="relative text-lg transition-transform duration-300 group-hover:rotate-12">
            ✦
          </span>

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

        </button>

      </div>

    </div>
  );
}
