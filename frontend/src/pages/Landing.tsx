import { Link } from "react-router";
import { useEffect, useState } from "react";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
/* =========================================================
   NEXUS AI
   Premium Enterprise Landing Page

   Assets:
   /public/background.jpg
   /public/nexus-logo.jpg
========================================================= */


/* =========================================================
   DATA
========================================================= */

const modules = [
  {
    number: "01",
    title: "Risque projet",
    subtitle: "Anticiper avant de subir",
    description:
      "NEXUS AI estime l'effort nécessaire d'un projet et identifie les facteurs susceptibles de provoquer un dépassement.",
    color: "#22D3EE",
    icon: "◈",
    tags: ["XGBoost", "Random Forest", "SHAP"],
  },
  {
    number: "02",
    title: "Support intelligent",
    subtitle: "Prioriser ce qui compte",
    description:
      "Chaque ticket client est automatiquement analysé selon sa catégorie, son urgence et le sentiment exprimé.",
    color: "#8B5CF6",
    icon: "✦",
    tags: ["NLP", "Classification", "Sentiment"],
  },
  {
    number: "03",
    title: "Santé financière",
    subtitle: "Comprendre les signaux faibles",
    description:
      "Les données financières sont transformées en ratios et analysées afin d'identifier les signes de tension.",
    color: "#3B82F6",
    icon: "◇",
    tags: ["XGBoost", "Classification", "Ratios"],
  },
];

const methodSteps = [
  {
    number: "01",
    title: "Centralisez",
    description:
      "Projets, tickets et données financières sont réunis dans une plateforme unique.",
  },
  {
    number: "02",
    title: "Analysez",
    description:
      "Trois modèles IA spécialisés étudient chaque dimension indépendamment.",
  },
  {
    number: "03",
    title: "Comprenez",
    description:
      "Les résultats sont expliqués grâce aux facteurs les plus importants.",
  },
  {
    number: "04",
    title: "Décidez",
    description:
      "Le système transforme les analyses en alertes et recommandations.",
  },
];

const roles = [
  {
    icon: "◉",
    title: "Direction",
    text: "Vision globale de la santé de l'entreprise.",
  },
  {
    icon: "◇",
    title: "Chef de projet",
    text: "Suivi des projets et analyse du risque.",
  },
  {
    icon: "✦",
    title: "Support",
    text: "Tickets automatiquement priorisés.",
  },
  {
    icon: "○",
    title: "Client",
    text: "Visibilité claire sur l'avancement.",
  },
];


/* =========================================================
   BACKGROUND
========================================================= */

function NexusBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

      {/* IMAGE */}
      <div
        className="absolute inset-[-25px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background.jpg')",
          filter: "blur(7px)",
          transform: "scale(1.05)",
        }}
      />

      {/* DARK GLASS OVERLAY */}
      <div className="absolute inset-0 bg-[#050817]/55" />

      {/* NAVY GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050817]/35 via-[#050817]/30 to-[#050817]/95" />

      {/* CYAN LIGHT */}
      <div className="absolute -left-[180px] top-[12%] h-[500px] w-[500px] rounded-full bg-[#22D3EE]/10 blur-[150px]" />

      {/* VIOLET LIGHT */}
      <div className="absolute -right-[180px] top-[25%] h-[600px] w-[600px] rounded-full bg-[#8B5CF6]/10 blur-[170px]" />

      {/* BLUE LIGHT */}
      <div className="absolute left-[35%] top-[60%] h-[450px] w-[450px] rounded-full bg-[#3B82F6]/10 blur-[150px]" />

      {/* TOP FADE */}
      <div className="absolute inset-x-0 top-0 h-[250px] bg-gradient-to-b from-[#02040D]/45 to-transparent" />

      {/* BOTTOM FADE */}
      <div className="absolute inset-x-0 bottom-0 h-[350px] bg-gradient-to-t from-[#050817] to-transparent" />
    </div>
  );
}


/* =========================================================
   GLASS NAVBAR
========================================================= */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const links = [
    { label: "Produit", href: "#product" },
    { label: "Intelligence IA", href: "#ai" },
    { label: "Méthode", href: "#method" },
    { label: "Sécurité", href: "#security" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10">

      {/* =====================================================
          OUTER GLOW
      ===================================================== */}

      <div
        className={`pointer-events-none absolute left-4 right-4 top-4 h-[76px] rounded-[22px] transition-all duration-500 sm:left-6 sm:right-6 lg:left-10 lg:right-10 ${
          scrolled
            ? "bg-[#22D3EE]/[0.04] blur-2xl"
            : "bg-[#8B5CF6]/[0.025] blur-3xl"
        }`}
      />

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav
        className={`
          relative mx-auto max-w-7xl
          overflow-hidden
          rounded-[22px]
          border
          transition-all duration-500

          ${
            scrolled
              ? "border-white/[0.14] bg-[#070C1C]/80 shadow-[0_20px_70px_rgba(0,0,0,.45)]"
              : "border-white/[0.10] bg-[#071022]/55 shadow-[0_15px_50px_rgba(0,0,0,.28)]"
          }

          backdrop-blur-2xl
        `}
      >

        {/* ===================================================
            MIRROR TOP REFLECTION
        =================================================== */}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-12 bg-gradient-to-b from-white/[0.06] to-transparent blur-xl" />

        {/* ===================================================
            COLOR REFLECTION
        =================================================== */}

        <div className="pointer-events-none absolute -left-20 top-0 h-20 w-60 bg-[#22D3EE]/[0.06] blur-3xl" />

        <div className="pointer-events-none absolute -right-20 top-0 h-20 w-60 bg-[#8B5CF6]/[0.06] blur-3xl" />


        {/* ===================================================
            NAV CONTENT
        =================================================== */}

        <div className="relative flex h-[72px] items-center justify-between px-5 lg:px-7">

          {/* LOGO */}

          <Link
            to="/"
            className="group flex items-center gap-3"
          >
            <div className="relative">

              <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] opacity-0 blur-lg transition duration-500 group-hover:opacity-25" />

              <img
                src="/nexus-logo.jpg"
                alt="NEXUS AI"
                className="relative h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
              />
            </div>

            <div>
              <div className="font-['Space_Grotesk',sans-serif] text-[17px] font-bold tracking-tight text-white">
                NEXUS{" "}
                <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                  AI
                </span>
              </div>

              <div className="hidden text-[7px] font-medium uppercase tracking-[0.22em] text-slate-500 sm:block">
                Enterprise Intelligence
              </div>
            </div>
          </Link>


          {/* DESKTOP NAVIGATION */}

          <div className="hidden items-center gap-1 lg:flex">

            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative rounded-xl px-4 py-2.5 text-[12px] font-medium text-slate-400 transition hover:bg-white/[0.045] hover:text-white"
              >
                {link.label}

                <span className="absolute bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] transition-all duration-300 group-hover:w-1/2" />
              </a>
            ))}

          </div>


          {/* RIGHT */}

          <div className="hidden items-center gap-3 md:flex">
<LanguageSwitcher />
            <Link
              to="/signin"
              className="rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              Se connecter
            </Link>

            <Link
              to="/signup"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_0_30px_rgba(59,130,246,.18)] transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(139,92,246,.30)]"
            >
              <span className="relative z-10">
                Commencer
              </span>

              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
            </Link>

          </div>


          {/* MOBILE BUTTON */}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-300 md:hidden"
          >
            {mobileOpen ? "×" : "☰"}
          </button>

        </div>


        {/* ===================================================
            MOBILE MENU
        =================================================== */}

        {mobileOpen && (
          <div className="relative border-t border-white/[0.07] bg-[#050817]/80 px-5 pb-5 pt-3 backdrop-blur-2xl md:hidden">

            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                {link.label}
              </a>
            ))}

            <div className="my-3 h-px bg-white/[0.06]" />

            <Link
              to="/signin"
              className="block rounded-xl px-4 py-3 text-sm text-slate-400"
            >
              Se connecter
            </Link>

            <Link
              to="/signup"
              className="mt-2 block rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] px-4 py-3 text-center text-sm font-bold text-white"
            >
              Commencer
            </Link>

          </div>
        )}

      </nav>
    </header>
  );
}


/* =========================================================
   HEALTH ENGINE PREVIEW
========================================================= */

function HealthEnginePreview() {
  return (
    <div className="relative w-full max-w-[480px]">

      {/* OUTER GLOW */}

      <div className="absolute -inset-10 rounded-[50px] bg-gradient-to-r from-[#22D3EE]/10 via-[#3B82F6]/10 to-[#8B5CF6]/10 blur-3xl" />

      {/* CARD */}

      <div className="relative overflow-hidden rounded-[30px] border border-white/[0.11] bg-[#080E20]/80 p-7 shadow-[0_40px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl">

        {/* top reflection */}

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/70 to-transparent" />

        <div className="absolute left-[15%] right-[15%] top-0 h-20 bg-white/[0.025] blur-xl" />


        {/* HEADER */}

        <div className="relative flex items-start justify-between">

          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#22D3EE]">
              Enterprise Health Engine
            </p>

            <p className="mt-2 text-[11px] text-slate-500">
              Vue consolidée de l'entreprise
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-3 py-1.5">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />

            <span className="font-mono text-[8px] font-bold text-[#67E8F9]">
              LIVE
            </span>

          </div>

        </div>


        {/* SCORE */}

        <div className="relative mt-9 flex items-center gap-7">

          <div className="relative flex h-[150px] w-[150px] shrink-0 items-center justify-center">

            <div className="absolute inset-0 rounded-full border-[10px] border-white/[0.035]" />

            <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#22D3EE] border-r-[#3B82F6] border-b-[#8B5CF6] rotate-[-25deg]" />

            <div className="text-center">

              <div className="font-['Space_Grotesk',sans-serif] text-4xl font-bold text-white">
                74
              </div>

              <div className="font-mono text-[8px] text-slate-600">
                HEALTH SCORE
              </div>

            </div>

          </div>


          {/* SUB SCORES */}

          <div className="flex-1 space-y-4">

            {[
              ["Risque projet", "65", "#22D3EE"],
              ["Support client", "70", "#8B5CF6"],
              ["Finance", "88", "#3B82F6"],
            ].map(([label, value, color]) => (

              <div key={label}>

                <div className="mb-2 flex justify-between">

                  <span className="text-[10px] text-slate-500">
                    {label}
                  </span>

                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color }}
                  >
                    {value}
                  </span>

                </div>

                <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">

                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${value}%`,
                      background: color,
                      boxShadow: `0 0 12px ${color}`,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

        </div>


        {/* INSIGHT */}

        <div className="relative mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">

          <div className="flex gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/15 to-[#8B5CF6]/15 text-[#22D3EE]">
              ✦
            </div>

            <div>

              <div className="text-[11px] font-semibold text-white">
                Analyse principale
              </div>

              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                Le risque projet est actuellement le facteur dominant.
                L'analyse SHAP identifie notamment une équipe sous-dimensionnée.
              </p>

            </div>

          </div>

        </div>


        {/* SHAP BADGE */}

        <div className="absolute right-5 top-[120px] rounded-xl border border-[#8B5CF6]/20 bg-[#10172D]/90 px-3 py-2 shadow-[0_0_30px_rgba(139,92,246,.15)] backdrop-blur-xl">

          <span className="font-mono text-[8px] font-bold text-[#C4B5FD]">
            SHAP EXPLAINED
          </span>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   HERO
========================================================= */

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-32">

      {/* GRID */}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />


      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8">

        {/* LEFT */}

        <div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#071224]/55 px-3.5 py-2 shadow-[0_0_25px_rgba(34,211,238,.05)] backdrop-blur-xl">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_12px_#22D3EE]" />

            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#67E8F9]">
              Enterprise AI Platform
            </span>

          </div>


          <h1 className="mt-7 max-w-3xl font-['Space_Grotesk',sans-serif] text-5xl font-bold leading-[1.03] tracking-[-0.045em] text-white md:text-6xl lg:text-[68px]">

            Transformez vos données

            <br />

            <span className="bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
              en décisions.
            </span>

          </h1>


          <p className="mt-7 max-w-xl text-[14px] leading-8 text-slate-400 md:text-[15px]">

            NEXUS AI connecte les projets, le support client et les finances
            de votre agence pour créer une vision unique, explicable et
            actionnable de votre entreprise.

          </p>


          {/* BUTTONS */}

          <div className="mt-9 flex flex-wrap gap-3">

            <Link
              to="/signup"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_35px_rgba(59,130,246,.20)] transition hover:-translate-y-1"
            >

              <span className="relative z-10">
                Découvrir NEXUS AI →
              </span>

              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

            </Link>


            <a
              href="#method"
              className="rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-xl transition hover:border-[#22D3EE]/20 hover:bg-white/[0.06] hover:text-white"
            >
              Comment ça marche ?
            </a>

          </div>


          {/* TRUST */}

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">

            {[
              "IA spécialisée",
              "SHAP explicable",
              "Validation humaine",
              "Audit sécurisé",
            ].map((item) => (

              <div
                key={item}
                className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-600"
              >

                <span className="text-[#22D3EE]">
                  ✓
                </span>

                {item}

              </div>

            ))}

          </div>

        </div>


        {/* RIGHT */}

        <div className="relative flex justify-center lg:justify-end">

          <div className="absolute h-[420px] w-[420px] rounded-full border border-[#22D3EE]/[0.05]" />

          <div className="absolute h-[330px] w-[330px] rounded-full border border-[#8B5CF6]/[0.05]" />

          <HealthEnginePreview />

        </div>

      </div>


      {/* FADE */}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050817] to-transparent" />

    </section>
  );
}


/* =========================================================
   PRODUCT
========================================================= */

function ProductSection() {
  return (
    <section
      id="product"
      className="relative border-t border-white/[0.05] py-28"
    >

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <div className="grid gap-16 lg:grid-cols-[.85fr_1.15fr] lg:items-center">

          <div>

            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#22D3EE]">
              Une plateforme. Une vision.
            </span>

            <h2 className="mt-5 font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-white md:text-5xl">

              Tous les signaux

              <br />

              <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                au même endroit.
              </span>

            </h2>

            <p className="mt-6 max-w-lg text-sm leading-8 text-slate-500">
              NEXUS AI évite de traiter chaque problème séparément.
              Les signaux opérationnels, clients et financiers sont reliés
              pour fournir une lecture globale de l'entreprise.
            </p>


            <div className="mt-8 grid grid-cols-2 gap-3">

              {[
                ["03", "Modèles IA"],
                ["01", "Score global"],
                ["∞", "Signaux connectés"],
                ["100%", "Explicable"],
              ].map(([value, label]) => (

                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 backdrop-blur-xl"
                >

                  <div className="font-mono text-xl font-bold text-white">
                    {value}
                  </div>

                  <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                    {label}
                  </div>

                </div>

              ))}

            </div>

          </div>


          <HealthEnginePreview />

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   AI MODULES
========================================================= */

function AISection() {
  return (
    <section
      id="ai"
      className="relative border-y border-white/[0.05] bg-[#070C19]/55 py-28 backdrop-blur-[2px]"
    >

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <div className="max-w-2xl">

          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8B5CF6]">
            Intelligence artificielle
          </span>

          <h2 className="mt-5 font-['Space_Grotesk',sans-serif] text-4xl font-bold text-white md:text-5xl">
            Trois intelligences.
            <br />

            <span className="text-slate-500">
              Une seule vision.
            </span>
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-500">
            Chaque modèle est spécialisé dans une problématique métier,
            puis leurs résultats sont fusionnés par l'Enterprise Health Engine.
          </p>

        </div>


        <div className="mt-14 grid gap-5 md:grid-cols-3">

          {modules.map((module) => (

            <div
              key={module.number}
              className="group relative"
            >

              <div
                className="absolute -inset-px rounded-[26px] opacity-0 blur-md transition duration-500 group-hover:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${module.color}, #8B5CF6)`,
                }}
              />

              <div className="relative h-full rounded-[26px] border border-white/[0.07] bg-[#080E20]/80 p-7 backdrop-blur-xl transition duration-500 group-hover:-translate-y-2">

                <div className="flex items-center justify-between">

                  <span
                    className="font-mono text-[9px] font-bold tracking-[0.2em]"
                    style={{ color: module.color }}
                  >
                    MODULE {module.number}
                  </span>

                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-lg"
                    style={{ color: module.color }}
                  >
                    {module.icon}
                  </div>

                </div>


                <h3 className="mt-7 font-['Space_Grotesk',sans-serif] text-xl font-bold text-white">
                  {module.title}
                </h3>

                <p
                  className="mt-2 text-xs font-semibold"
                  style={{ color: module.color }}
                >
                  {module.subtitle}
                </p>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  {module.description}
                </p>


                <div className="mt-6 flex flex-wrap gap-2">

                  {module.tags.map((tag) => (

                    <span
                      key={tag}
                      className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 font-mono text-[8px] text-slate-500"
                    >
                      {tag}
                    </span>

                  ))}

                </div>

              </div>

            </div>

          ))}

        </div>


        {/* GROQ */}

        <div className="mt-7 rounded-2xl border border-[#8B5CF6]/10 bg-[#8B5CF6]/[0.025] p-5 backdrop-blur-xl">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#C4B5FD]">
              ✦
            </div>

            <div>

              <h3 className="text-sm font-semibold text-white">
                Une IA générative, mais jamais pour inventer les chiffres.
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Les scores et prédictions sont calculés par les modèles
                entraînés ou par Laravel. Groq intervient uniquement pour
                reformuler les résultats en langage naturel.
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   METHOD
========================================================= */

function MethodSection() {
  return (
    <section
      id="method"
      className="relative py-28"
    >

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <div className="text-center">

          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#22D3EE]">
            Méthode d'utilisation
          </span>

          <h2 className="mt-5 font-['Space_Grotesk',sans-serif] text-4xl font-bold text-white md:text-5xl">
            De vos données
            <br />

            <span className="text-slate-500">
              à une décision.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500">
            Un parcours simple : centraliser, analyser, comprendre,
            puis agir.
          </p>

        </div>


        <div className="relative mt-20 grid gap-5 md:grid-cols-4">

          <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-[#22D3EE]/30 via-[#3B82F6]/30 to-[#8B5CF6]/30 md:block" />

          {methodSteps.map((step) => (

            <div
              key={step.number}
              className="relative text-center"
            >

              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#090F22]/90 font-mono text-xs font-bold text-[#22D3EE] shadow-[0_0_30px_rgba(34,211,238,.08)] backdrop-blur-xl">
                {step.number}
              </div>

              <h3 className="mt-6 font-['Space_Grotesk',sans-serif] font-bold text-white">
                {step.title}
              </h3>

              <p className="mt-3 text-xs leading-6 text-slate-500">
                {step.description}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   ROLES
========================================================= */

function RolesSection() {
  return (
    <section className="border-y border-white/[0.05] bg-[#070C19]/60 py-28 backdrop-blur-[2px]">

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr] lg:items-center">

          <div>

            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#3B82F6]">
              Expérience par rôle
            </span>

            <h2 className="mt-5 font-['Space_Grotesk',sans-serif] text-4xl font-bold text-white md:text-5xl">

              La bonne information.

              <br />

              <span className="text-slate-500">
                Au bon utilisateur.
              </span>

            </h2>

            <p className="mt-6 max-w-md text-sm leading-8 text-slate-500">
              Chaque rôle dispose d'une expérience adaptée à ses besoins
              opérationnels.
            </p>

          </div>


          <div className="grid gap-3 sm:grid-cols-2">

            {roles.map((role) => (

              <div
                key={role.title}
                className="group rounded-2xl border border-white/[0.06] bg-[#080E20]/75 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#22D3EE]/20"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/10 to-[#8B5CF6]/10 text-[#22D3EE]">
                    {role.icon}
                  </div>

                  <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-white">
                    {role.title}
                  </h3>

                </div>

                <p className="mt-4 text-xs leading-6 text-slate-500">
                  {role.text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   SECURITY
========================================================= */

function SecuritySection() {
  const items = [
    {
      icon: "◉",
      title: "Permissions strictes",
      text: "Les comptes sont créés uniquement par invitation.",
    },
    {
      icon: "✦",
      title: "Explicabilité",
      text: "Les prédictions sont accompagnées de facteurs explicatifs.",
    },
    {
      icon: "✓",
      title: "Validation humaine",
      text: "Les décisions critiques restent sous contrôle humain.",
    },
    {
      icon: "◇",
      title: "Journal d'audit",
      text: "Les actions sensibles sont systématiquement journalisées.",
    },
  ];

  return (
    <section
      id="security"
      className="relative py-28"
    >

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <div className="rounded-[32px] border border-white/[0.08] bg-[#080E20]/75 p-8 shadow-[0_30px_80px_rgba(0,0,0,.25)] backdrop-blur-2xl md:p-12">

          {/* REFLECTION */}

          <div className="pointer-events-none absolute left-[20%] right-[20%] h-20 bg-white/[0.025] blur-3xl" />

          <div className="relative grid gap-12 lg:grid-cols-[.7fr_1.3fr]">

            <div>

              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#22D3EE]">
                Trust by design
              </span>

              <h2 className="mt-5 font-['Space_Grotesk',sans-serif] text-3xl font-bold text-white md:text-4xl">

                Une IA qui explique

                <br />

                <span className="text-slate-500">
                  avant de recommander.
                </span>

              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-500">
                NEXUS AI assiste la décision humaine. Il ne remplace pas
                aveuglément le jugement des équipes.
              </p>

            </div>


            <div className="grid gap-3 sm:grid-cols-2">

              {items.map((item) => (

                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                >

                  <div className="text-lg text-[#22D3EE]">
                    {item.icon}
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[11px] leading-6 text-slate-500">
                    {item.text}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   CTA
========================================================= */

function CTA() {
  return (
    <section className="relative overflow-hidden py-32">

      <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3B82F6]/10 blur-[150px]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#080E20]/70 shadow-[0_0_40px_rgba(34,211,238,.08)] backdrop-blur-xl">

          <img
            src="/nexus-logo.jpg"
            alt="NEXUS AI"
            className="h-10 w-10 rounded-xl object-cover"
          />

        </div>


        <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.22em] text-[#22D3EE]">
          Enterprise Intelligence
        </p>


        <h2 className="mt-4 font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-white md:text-5xl">

          Vos données parlent déjà.

          <br />

          <span className="bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
            NEXUS les connecte.
          </span>

        </h2>


        <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-500">
          Une plateforme conçue pour transformer les données complexes
          des agences digitales en décisions compréhensibles.
        </p>


        <div className="mt-9 flex flex-wrap justify-center gap-3">

          <Link
            to="/signup"
            className="rounded-xl bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_40px_rgba(59,130,246,.2)] transition hover:-translate-y-1"
          >
            Commencer avec NEXUS AI
          </Link>

          <Link
            to="/signin"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            Se connecter
          </Link>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-[#040711]/90 py-9">

      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 sm:flex-row lg:px-8">

        <div className="flex items-center gap-3">

          <img
            src="/nexus-logo.jpg"
            alt="NEXUS AI"
            className="h-9 w-9 rounded-lg object-cover"
          />

          <div>

            <div className="text-sm font-bold text-white">
              NEXUS{" "}
              <span className="text-[#22D3EE]">
                AI
              </span>
            </div>

            <div className="text-[7px] uppercase tracking-[0.2em] text-slate-700">
              Enterprise Intelligence
            </div>

          </div>

        </div>


        <div className="flex flex-wrap items-center gap-5 text-[9px] text-slate-600">

          <a
            href="#product"
            className="transition hover:text-white"
          >
            Produit
          </a>

          <a
            href="#ai"
            className="transition hover:text-white"
          >
            IA
          </a>

          <a
            href="#method"
            className="transition hover:text-white"
          >
            Méthode
          </a>

          <a
            href="#security"
            className="transition hover:text-white"
          >
            Sécurité
          </a>

          <span>
            © {new Date().getFullYear()} NEXUS AI
          </span>

        </div>

      </div>

    </footer>
  );
}


/* =========================================================
   MAIN
========================================================= */

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050817] font-['Inter',sans-serif] text-white">

      {/* =====================================================
          BACKGROUND — TOUJOURS DERRIÈRE
      ===================================================== */}

      <NexusBackground />


      {/* =====================================================
          CONTENT — TOUJOURS DEVANT
      ===================================================== */}

      <div className="relative z-10">

        <Navbar />

        <Hero />

        <ProductSection />

        <AISection />

        <MethodSection />

        <RolesSection />

        <SecuritySection />

        <CTA />

        <Footer />

      </div>

    </main>
  );
}