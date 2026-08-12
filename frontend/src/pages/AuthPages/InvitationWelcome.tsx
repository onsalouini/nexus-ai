import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../../lib/api";

const ROLE_CONTENT: Record<string, { title: string; points: string[] }> = {
  chef_de_projet: {
    title: "Bienvenue, futur Chef de projet",
    points: [
      "Créez vos projets et suivez leur risque de dérive, prédit et expliqué par IA",
      "Constituez votre équipe et assignez qui fait quoi sur chaque projet",
      "Invitez vos clients à suivre l'avancement de leur projet",
      "Recevez des alertes avant qu'un problème ne devienne critique",
    ],
  },

  agent_support: {
    title: "Bienvenue, futur Agent Support",
    points: [
      "Traitez une file de tickets déjà triée par urgence et sentiment",
      "Corrigez les classifications si besoin — vos retours améliorent le modèle",
      "Suivez vos statistiques de résolution",
    ],
  },
};

export default function InvitationWelcome() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const navigate = useNavigate();

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }

    api
      .get(`/invitations/validate/${token}`)
      .then((res) => setRole(res.data.role))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] text-white">
        {/* Ambient glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/[0.06] blur-[120px]" />

        <div className="relative flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-[#22D3EE]/30 blur-xl" />

            <img
              src="/nexus-logo.jpg"
              alt="NEXUS AI"
              className="relative h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
            />
          </div>

          <div className="mt-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Initialisation NEXUS AI
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     INVALID INVITATION
  ========================================================= */

  if (error || !role) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 text-white">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#22D3EE]/[0.05] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/[0.06] blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative w-full max-w-md">
          <div className="nexus-glass rounded-3xl border border-white/[0.08] p-8 text-center shadow-2xl">
            {/* Logo */}
            <div className="mx-auto relative h-16 w-16">
              <div className="absolute inset-0 rounded-2xl bg-[#F2497A]/20 blur-xl" />

              <img
                src="/nexus-logo.jpg"
                alt="NEXUS AI"
                className="relative h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
              />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#F2497A]/20 bg-[#F2497A]/[0.05] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F2497A] shadow-[0_0_8px_#F2497A]" />

              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#FB7185]">
                Access denied
              </span>
            </div>

            <h1 className="mt-5 font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-white">
              Invitation invalide
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Cette invitation est invalide ou a expiré. Demandez un nouveau
              lien à la personne qui vous a invité.
            </p>

            <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-slate-600">
              <span className="h-px w-8 bg-white/10" />
              NEXUS AI
              <span className="h-px w-8 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = ROLE_CONTENT[role] ?? {
    title: "Bienvenue",
    points: [],
  };

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Cyan glow */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#22D3EE]/[0.06] blur-[140px]" />

        {/* Violet glow */}
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#8B5CF6]/[0.07] blur-[140px]" />

        {/* Center subtle glow */}
        <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/[0.025] blur-[120px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top line */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/40 to-transparent" />
      </div>

      {/* =====================================================
          NAV / BRAND
      ===================================================== */}

      <header className="relative z-10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Real logo */}
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-[#22D3EE]/25 blur-lg" />

              <img
                src="/nexus-logo.jpg"
                alt="NEXUS AI"
                className="relative h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
              />
            </div>

            <div>
              <div className="font-['Space_Grotesk',sans-serif] text-sm font-bold tracking-wide text-white">
                NEXUS{" "}
                <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                  AI
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">
                  Intelligent workspace
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              Secure invitation
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="relative z-10 flex min-h-[calc(100vh-82px)] items-center justify-center px-5 pb-12 pt-8">
        <div className="w-full max-w-2xl">
          {/* Top status */}
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-3.5 py-1.5 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />

              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#67E8F9]">
                Access granted
              </span>
            </div>
          </div>

          {/* Main glass card */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#071021]/70 shadow-[0_25px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            {/* Card glow */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#22D3EE]/[0.07] blur-[90px]" />

            <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-[#8B5CF6]/[0.06] blur-[90px]" />

            {/* Top gradient line */}
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />

            <div className="relative p-7 sm:p-10">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-5 rounded-[28px] bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 blur-2xl" />

                  <img
                    src="/nexus-logo.jpg"
                    alt="NEXUS AI"
                    className="relative h-20 w-20 rounded-[22px] object-cover ring-1 ring-white/10 shadow-2xl"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="mt-8 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#22D3EE]">
                  Votre espace NEXUS
                </p>

                <h1 className="mx-auto mt-3 max-w-xl font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {content.title}
                </h1>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                  Votre environnement intelligent est prêt. Découvrez les
                  fonctionnalités disponibles selon votre rôle.
                </p>
              </div>

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.07]" />

                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-700">
                  capabilities
                </span>

                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              {/* Features */}
              <div className="space-y-3">
                {content.points.map((point, index) => (
                  <div
                    key={point}
                    className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition duration-300 hover:border-[#22D3EE]/20 hover:bg-[#22D3EE]/[0.035]"
                  >
                    {/* Number */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/15 bg-[#22D3EE]/[0.05]">
                      <span className="font-mono text-[10px] font-semibold text-[#67E8F9]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex-1 pt-1">
                      <p className="text-sm leading-6 text-slate-300 transition group-hover:text-white">
                        {point}
                      </p>
                    </div>

                    {/* Check */}
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16B378]/10 text-[#16B378]">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M5 12l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() =>
                  navigate(`/invitation/complete?token=${token}`)
                }
                className="group relative mt-8 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] p-[1px] shadow-[0_0_30px_rgba(34,211,238,0.12)] transition duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.22)]"
              >
                <span className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-[#071021] text-sm font-semibold text-white transition group-hover:bg-transparent">
                  Continuer vers mon espace

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </button>

              {/* Security */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-600"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
                  Invitation sécurisée · NEXUS AI
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-700">
              Project intelligence · predictive analytics · AI
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}