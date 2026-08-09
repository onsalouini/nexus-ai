import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

/**
 * Polices (à ajouter dans index.html <head>, une seule fois) :
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
 */

const NAV_LINKS = [
  { href: "#modules", label: "Modules" },
  { href: "#comment", label: "Comment ça marche" },
  { href: "#roles", label: "Équipe & rôles" },
];

const CHANNELS = [
  { key: "risk", label: "Risque projet", value: 65, color: "#16B378" },
  { key: "support", label: "Support client", value: 70, color: "#2E9BE6" },
  { key: "finance", label: "Santé financière", value: 88, color: "#F2497A" },
];
const FUSED_SCORE = 74;

/* ---------- Navbar avec indicateur glissant ---------- */
function InteractiveNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = e.currentTarget;
    const parent = navRef.current;
    if (!parent) return;
    const elRect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    setPill({ left: elRect.left - parentRect.left, width: elRect.width, opacity: 1 });
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 shadow-[0_1px_20px_rgba(15,23,42,0.06)] backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#16B378] via-[#2E9BE6] to-[#F2497A] font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-md shadow-[#2E9BE6]/20">
            N
          </div>
          <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold tracking-tight text-slate-900">
            NEXUS <span className="text-[#2E9BE6]">AI</span>
          </span>
        </Link>

        <nav ref={navRef} className="relative hidden items-center gap-1 md:flex" onMouseLeave={() => setPill((p) => ({ ...p, opacity: 0 }))}>
          <div
            className="absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-slate-100 transition-all duration-300 ease-out"
            style={{ left: pill.left, width: pill.width, opacity: pill.opacity }}
          />
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onMouseEnter={handleEnter}
              className="relative z-10 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/signin" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 sm:block">
            Se connecter
          </Link>
          <Link
            to="/signup"
            className="group relative overflow-hidden rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            <span className="relative z-10">Créer un compte</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#16B378] via-[#2E9BE6] to-[#F2497A] transition-transform duration-300 group-hover:translate-x-0" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- Carte console (hero) ---------- */
function LiveConsoleCard() {
  const ringR = 42;
  const circumference = 2 * Math.PI * ringR;
  const offset = circumference * (1 - FUSED_SCORE / 100);

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-white bg-white/70 p-7 shadow-[0_20px_60px_-15px_rgba(46,155,230,0.25)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Enterprise Health Engine
        </span>
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#16B378]" />
      </div>

      <div className="mt-6 flex items-center gap-6">
        <svg viewBox="0 0 110 110" className="h-28 w-28 shrink-0">
          <circle cx="55" cy="55" r={ringR} fill="none" stroke="#EEF2F6" strokeWidth="10" />
          <circle
            cx="55"
            cy="55"
            r={ringR}
            fill="none"
            stroke="url(#fusedGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
          >
            <animate attributeName="stroke-dashoffset" from={circumference} to={offset} dur="1.2s" fill="freeze" />
          </circle>
          <defs>
            <linearGradient id="fusedGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2E9BE6" />
              <stop offset="100%" stopColor="#F2497A" />
            </linearGradient>
          </defs>
          <text x="55" y="51" textAnchor="middle" className="font-mono" fontSize="24" fontWeight="700" fill="#0F172A">
            {FUSED_SCORE}
          </text>
          <text x="55" y="68" textAnchor="middle" fontSize="8" letterSpacing="0.08em" fill="#94A3B8">
            /100
          </text>
        </svg>

        <div className="flex-1 space-y-3">
          {CHANNELS.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">{c.label}</span>
                <span className="font-mono font-semibold" style={{ color: c.color }}>
                  {c.value}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${c.value}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-700">Pourquoi ce score : </span>
        risque projet en légère tension (65) — facteur dominant sur la baisse.
      </div>

      {/* badges flottants */}
      <div className="absolute -right-5 -top-5 animate-[float_4s_ease-in-out_infinite] rounded-2xl border border-white bg-white px-3 py-2 text-xs font-semibold text-[#16B378] shadow-lg">
        ✓ SHAP expliqué
      </div>
      <div className="absolute -bottom-4 -left-5 animate-[float_5s_ease-in-out_infinite] rounded-2xl border border-white bg-white px-3 py-2 text-xs font-semibold text-[#2E9BE6] shadow-lg">
        Validation humaine
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

const modules = [
  {
    label: "Module 01",
    title: "Risque projet",
    desc: "Prédit l'effort réel d'un projet et alerte avant le dépassement, avec les facteurs expliqués (SHAP).",
    color: "#16B378",
    bg: "bg-[#EAFBF3]",
    ring: "hover:shadow-[#16B378]/15",
  },
  {
    label: "Module 02",
    title: "Support client",
    desc: "Classe et priorise chaque ticket entrant par urgence et sentiment réel, pas par ordre d'arrivée.",
    color: "#2E9BE6",
    bg: "bg-[#EAF5FE]",
    ring: "hover:shadow-[#2E9BE6]/15",
  },
  {
    label: "Module 03",
    title: "Santé financière",
    desc: "Transforme les ratios financiers bruts en un score de tension, avant que la trésorerie ne devienne un problème.",
    color: "#F2497A",
    bg: "bg-[#FEECF1]",
    ring: "hover:shadow-[#F2497A]/15",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-['IBM_Plex_Sans',sans-serif] text-slate-900">
      <InteractiveNavbar />

      {/* HERO */}
      <section className="relative overflow-hidden pb-24 pt-40">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#16B378] opacity-[0.10] blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-[#2E9BE6] opacity-[0.12] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-[#F2497A] opacity-[0.08] blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 shadow-sm">
              Pour les agences digitales
            </span>
            <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
              Vos projets, votre support
              <br />
              et vos finances,{" "}
              <span className="bg-gradient-to-r from-[#16B378] via-[#2E9BE6] to-[#F2497A] bg-clip-text text-transparent">
                un seul score.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-slate-500">
              NEXUS AI relie ce que vos projets, vos tickets et vos finances
              disent séparément, et le fusionne en un score de santé
              d'entreprise unique — expliqué, pas deviné.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                to="/signup"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Créer le compte de mon entreprise
              </Link>
              <Link to="/signin" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                J'ai déjà un compte →
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <LiveConsoleCard />
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="bg-slate-50/70 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#2E9BE6]">
            Le cœur data science
          </span>
          <h2 className="mt-3 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-slate-900">
            Trois modèles entraînés, un moteur de fusion
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
            Chaque module produit son propre signal. L'Enterprise Health Engine
            les combine — sans jamais en deviner un à votre place.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m.title}
                className={`group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl ${m.ring}`}
              >
                <div
                  className={`mb-5 inline-flex rounded-md ${m.bg} px-2.5 py-1 font-mono text-xs font-semibold`}
                  style={{ color: m.color }}
                >
                  {m.label}
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-slate-900">{m.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{m.desc}</p>
                <div
                  className="mt-5 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16"
                  style={{ backgroundColor: m.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES / CASCADE */}
      <section id="roles" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#F2497A]">
            Accès par invitation
          </span>
          <h2 className="mt-3 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-slate-900">
            Chaque rôle voit ce qui le concerne
          </h2>

          <div className="mt-12 flex flex-col gap-3 md:flex-row md:items-center md:gap-0">
            {["Admin", "Direction", "Chef de projet", "Client externe"].map((role, i, arr) => (
              <div key={role} className="flex flex-1 items-center">
                <div className="flex-1 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4 text-center shadow-sm transition hover:shadow-md">
                  <span className="text-sm font-semibold text-slate-800">{role}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="mx-3 hidden bg-gradient-to-r from-[#16B378] to-[#2E9BE6] bg-clip-text text-lg font-bold text-transparent md:block">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Aucun compte ne s'auto-attribue de rôle : la création suit toujours
            cette cascade d'invitations.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-slate-50/70 py-10">
        <div className="mx-auto max-w-7xl px-6 font-mono text-xs text-slate-400">
          © {new Date().getFullYear()} NEXUS AI — plateforme de pilotage pour agences digitales.
        </div>
      </footer>
    </div>
  );
}