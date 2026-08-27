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
  ArrowUpRight,
  CheckCircle2,
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
      <div className="relative min-h-full overflow-hidden bg-[#030712] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
          <div className="absolute right-[-160px] top-[20%] h-[420px] w-[420px] rounded-full bg-violet-500/[0.05] blur-[120px]" />
        </div>

        <div className="relative flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border border-white/10 border-t-cyan-400" />
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Initialisation de votre espace NEXUS...
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
      <div className="relative min-h-full overflow-hidden bg-[#030712] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
        </div>

        <div className="relative flex min-h-[70vh] items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/10 bg-red-400/[0.06]">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Impossible de charger le dashboard
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {error ||
                "Une erreur est survenue lors de la récupération des données."}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/[0.14]"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { director, company } = data;

  const initials = `${director.first_name?.charAt(0) ?? ""}${
    director.last_name?.charAt(0) ?? ""
  }`;

  const jobTitle =
    director.job_title ||
    (director.role === "direction"
      ? "Direction"
      : director.role || "Administrateur");

  return (
    <div className="relative min-h-full overflow-hidden bg-[#030712] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* BACKGROUND                                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.055] blur-[140px]" />

        <div className="absolute -right-48 top-[20%] h-[520px] w-[520px] rounded-full bg-violet-500/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-300px] left-[40%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.035] blur-[140px]" />
      </div>

      <main className="relative px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">

          {/* ================================================================ */}
          {/* TOP BAR                                                          */}
          {/* ================================================================ */}

          <header className="border-b border-white/[0.07] pb-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />

                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
                    NEXUS / Direction
                  </span>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Bonjour,{" "}
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    {director.first_name}
                  </span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Pilotez votre organisation depuis une vue centralisée de
                  votre environnement NEXUS.
                </p>
              </div>

              {/* Director profile */}

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-slate-200">
                    {director.first_name} {director.last_name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {jobTitle}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                  <span className="text-sm font-semibold text-cyan-300">
                    {initials}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* ================================================================ */}
          {/* ORGANISATION                                                     */}
          {/* ================================================================ */}

          <section className="pt-9">

            <div className="mb-7 flex items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Organisation
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Votre entreprise
                </h2>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                <span className="text-xs font-medium text-emerald-400">
                  Organisation active
                </span>
              </div>
            </div>

            {/* ============================================================ */}
            {/* COMPANY MAIN                                                  */}
            {/* ============================================================ */}

            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">

              {/* subtle top accent */}

              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              <div className="p-6 sm:p-8 lg:p-9">

                {/* Company identity */}

                <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.12] to-blue-500/[0.06]">
                      <Building2 className="h-6 w-6 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                        Entreprise associée
                      </p>

                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {company.name}
                      </h3>
                    </div>
                  </div>

                  {company.industry && (
                    <div className="flex w-fit items-center gap-2 rounded-lg border border-violet-400/10 bg-violet-400/[0.05] px-3 py-2">
                      <BriefcaseBusiness className="h-4 w-4 text-violet-300" />

                      <span className="text-xs font-medium text-violet-200">
                        {company.industry}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}

                <div className="my-8 h-px bg-white/[0.06]" />

                {/* Information row */}

                <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">

                  {/* Email */}

                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-cyan-400/80" />

                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Email
                      </span>
                    </div>

                    <p className="break-all text-sm font-medium text-slate-300">
                      {company.email || "Non renseigné"}
                    </p>
                  </div>

                  {/* Phone */}

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-400/80" />

                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Téléphone
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-300">
                      {company.phone || "Non renseigné"}
                    </p>
                  </div>

                  {/* Employees */}

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-violet-400/80" />

                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Effectif
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-300">
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

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-400/80" />

                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Localisation
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-5 text-slate-300">
                      {company.address || "Non renseignée"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* NEXUS INTELLIGENCE                                               */}
          {/* ================================================================ */}

          <section className="mt-10">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-400/[0.08] bg-gradient-to-r from-cyan-400/[0.045] via-white/[0.02] to-violet-500/[0.045]">

              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/[0.06] blur-[80px]" />

              <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                      NEXUS Intelligence
                    </p>

                    <h3 className="mt-1 text-sm font-semibold text-white sm:text-base">
                      Votre environnement de pilotage intelligent
                    </h3>

                    <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                      NEXUS centralise progressivement vos données afin de
                      vous offrir une vision claire de vos équipes, projets et
                      performances.
                    </p>
                  </div>
                </div>

                <div className="hidden shrink-0 sm:block">
                  <ArrowUpRight className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}