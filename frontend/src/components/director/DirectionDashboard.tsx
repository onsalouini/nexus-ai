import { useEffect, useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  Users,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import {
  getDirectorDashboard,
  type DirectorDashboardData,
} from "../../services/directorService";

export default function DirectionDashboard() {
  const [data, setData] = useState<DirectorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const dashboard = await getDirectorDashboard();

        setData(dashboard);
      } catch (err) {
        console.error("Erreur chargement dashboard direction :", err);

        setError(
          "Impossible de charger les informations de votre espace de direction."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /*
   * --------------------------------------------------------------------------
   * LOADING
   * --------------------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Chargement de votre espace NEXUS...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * ERROR
   * --------------------------------------------------------------------------
   */

  if (error || !data) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative flex min-h-[70vh] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-red-400/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Impossible de charger le dashboard
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {error ||
                "Une erreur est survenue lors de la récupération des données."}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { director, company } = data;

  /*
   * --------------------------------------------------------------------------
   * DASHBOARD
   * --------------------------------------------------------------------------
   */

  return (
    <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">
      {/* ================================================================== */}
      {/* BACKGROUND                                                          */}
      {/* ================================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />

        <div className="absolute right-[-180px] top-[15%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.08] blur-[130px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[450px] w-[450px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
      </div>

      {/* ================================================================== */}
      {/* CONTENT                                                             */}
      {/* ================================================================== */}

      <div className="relative px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl">
          {/* ================================================================ */}
          {/* HEADER                                                           */}
          {/* ================================================================ */}

          <header className="mb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                {/* Eyebrow */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                    NEXUS • Espace Direction
                  </span>
                </div>

                {/* Greeting */}
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Bonjour,{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                    {director.first_name}
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Bienvenue dans votre espace de pilotage NEXUS. Retrouvez ici
                  une vision centralisée de votre organisation et de son
                  environnement professionnel.
                </p>
              </div>

              {/* Director identity */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 backdrop-blur-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/20 to-violet-500/20">
                  <span className="text-sm font-semibold text-cyan-300">
                    {director.first_name?.charAt(0)}
                    {director.last_name?.charAt(0)}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    {director.first_name} {director.last_name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {director.job_title ||
                      (director.role === "direction"
                        ? "Direction"
                        : director.role || "Administrateur")}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* ================================================================ */}
          {/* COMPANY SECTION                                                   */}
          {/* ================================================================ */}

          <section>
            {/* Section heading */}
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Votre organisation
                </span>

                <div className="h-px w-10 bg-gradient-to-r from-cyan-400/50 to-transparent" />
              </div>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                Présentation de votre entreprise
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Retrouvez les informations essentielles de l'organisation
                associée à votre espace de direction. Ces données constituent
                le contexte de référence de votre environnement NEXUS.
              </p>
            </div>

            {/* Company card */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-2xl">
              {/* ------------------------------------------------------------ */}
              {/* Company header                                               */}
              {/* ------------------------------------------------------------ */}

              <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-8">
                {/* Header glow */}
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  {/* Company identity */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-violet-500/15 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
                      <Building2 className="h-8 w-8 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Entreprise associée
                      </p>

                      <h3 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        {company.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Organisation connectée à votre espace de direction
                      </p>
                    </div>
                  </div>

                  {/* Industry */}
                  {company.industry && (
                    <div className="flex w-fit items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2">
                      <BriefcaseBusiness className="h-4 w-4 text-violet-300" />

                      <span className="text-sm font-medium text-violet-200">
                        {company.industry}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* Company information                                          */}
              {/* ------------------------------------------------------------ */}

              <div className="grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
                {/* Email */}
                <div className="group bg-[#06101f]/90 p-6 transition hover:bg-[#08172b]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 transition group-hover:border-cyan-400/20">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>

                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email professionnel
                  </p>

                  <p className="mt-2 break-all text-sm font-medium text-slate-200">
                    {company.email || "Non renseigné"}
                  </p>
                </div>

                {/* Phone */}
                <div className="group bg-[#06101f]/90 p-6 transition hover:bg-[#08172b]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-400/10 transition group-hover:border-blue-400/20">
                    <Phone className="h-5 w-5 text-blue-400" />
                  </div>

                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Téléphone
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-200">
                    {company.phone || "Non renseigné"}
                  </p>
                </div>

                {/* Employees */}
                <div className="group bg-[#06101f]/90 p-6 transition hover:bg-[#08172b]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/10 transition group-hover:border-violet-400/20">
                    <Users className="h-5 w-5 text-violet-400" />
                  </div>

                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Effectif
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-200">
                    {company.employees_count !== null &&
                    company.employees_count !== undefined
                      ? `${company.employees_count} ${
                          company.employees_count > 1
                            ? "collaborateurs"
                            : "collaborateur"
                        }`
                      : "Non renseigné"}
                  </p>
                </div>

                {/* Address */}
                <div className="group bg-[#06101f]/90 p-6 transition hover:bg-[#08172b] md:col-span-2 lg:col-span-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10">
                      <MapPin className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Adresse
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-200">
                        {company.address || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* NEXUS INTRODUCTION                                                */}
          {/* ================================================================ */}

          <section className="mt-8">
            <div className="relative overflow-hidden rounded-3xl border border-cyan-400/10 bg-gradient-to-r from-cyan-400/[0.06] via-blue-500/[0.04] to-violet-500/[0.07] p-6 backdrop-blur-xl sm:p-8">
              {/* Glow */}
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                  <Sparkles className="h-6 w-6 text-cyan-400" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                    NEXUS Intelligence
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Votre environnement de pilotage intelligent
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    NEXUS centralise les informations de votre organisation
                    afin de vous offrir progressivement une vision claire de
                    vos projets, de vos équipes et de la santé globale de votre
                    entreprise.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}