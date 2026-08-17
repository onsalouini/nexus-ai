import { useEffect, useState } from "react";

type ProjectItem = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  length: number;
  planned_effort: number;

  risk_score?: number | null;
  risk_level: string | null;

  // Résultat IA enregistré par Laravel
  predicted_effort?: number | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  planifie: {
    label: "Planifié",
    color: "text-sky-300 border-sky-400/20 bg-sky-400/[0.06]",
    dot: "bg-sky-400 shadow-[0_0_8px_#38BDF8]",
  },
  en_cours: {
    label: "En cours",
    color: "text-[#67E8F9] border-[#22D3EE]/20 bg-[#22D3EE]/[0.06]",
    dot: "bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]",
  },
  termine: {
    label: "Terminé",
    color: "text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.06]",
    dot: "bg-emerald-400 shadow-[0_0_8px_#34D399]",
  },
};

function riskConfig(level: string | null) {
  const normalized = level
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "eleve") {
    return {
      label: "Risque élevé",
      color: "text-[#F2497A]",
      bg: "bg-[#F2497A]/[0.07]",
      border: "border-[#F2497A]/20",
      bar: "bg-[#F2497A]",
      glow: "shadow-[0_0_12px_rgba(242,73,122,0.35)]",
      icon: "!",
    };
  }

  if (normalized === "moyen") {
    return {
      label: "Risque moyen",
      color: "text-amber-300",
      bg: "bg-amber-400/[0.06]",
      border: "border-amber-400/20",
      bar: "bg-amber-400",
      glow: "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
      icon: "!",
    };
  }

  if (normalized === "faible") {
    return {
      label: "Risque faible",
      color: "text-emerald-300",
      bg: "bg-emerald-400/[0.06]",
      border: "border-emerald-400/20",
      bar: "bg-emerald-400",
      glow: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
      icon: "✓",
    };
  }

  return {
    label: "Analyse en attente",
    color: "text-gray-400",
    bg: "bg-white/[0.03]",
    border: "border-white/[0.08]",
    bar: "bg-white/20",
    glow: "",
    icon: "•",
  };
}

function calculateGap(
  planned: number,
  predicted: number | null | undefined
): number | null {
  if (predicted == null || planned <= 0) {
    return null;
  }

  return ((predicted - planned) / planned) * 100;
}

export default function ProjectsGrid({
  projects,
}: {
  projects: ProjectItem[];
}) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectItem | null>(null);

  // Fermer la modal avec Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedProject(null);
      }
    }

    if (selectedProject) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedProject]);

  function onViewRisk(project: ProjectItem) {
    setSelectedProject(project);
  }

  /*
   * EMPTY STATE
   */
  if (projects.length === 0) {
    return (
      <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#071021]/60 p-12 text-center backdrop-blur-2xl">
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#22D3EE]/[0.06] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[var(--nexus-violet)]/[0.06] blur-3xl" />

        <div className="relative mx-auto flex max-w-md flex-col items-center">
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
            <img
              src="/nexus-logo.jpg"
              alt="NEXUS AI"
              className="h-16 w-16 rounded-xl object-cover"
            />
          </div>

          <span className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#67E8F9]">
            Project Intelligence
          </span>

          <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold text-white">
            Aucun projet actif
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Votre espace NEXUS est prêt. Créez votre premier projet pour
            commencer l'analyse intelligente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================================
          PROJECTS SECTION
      ========================================================= */}
      <section className="relative mt-8">
        {/* Ambient light */}
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#22D3EE]/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute -right-24 top-32 h-64 w-64 rounded-full bg-[var(--nexus-violet)]/[0.035] blur-3xl" />

        {/* Section header */}
        <div className="relative mb-5 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Intelligence workspace
              </span>
            </div>

            <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold tracking-tight text-white">
              Vos projets
            </h2>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 sm:flex">
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
              {projects.length} projet{projects.length > 1 ? "s" : ""}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#22D3EE]/70" />

            <span className="font-mono text-[9px] uppercase tracking-wider text-[#67E8F9]">
              Live
            </span>
          </div>
        </div>

        {/* Projects grid */}
        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const status =
              STATUS_CONFIG[project.status] ?? {
                label: project.status,
                color: "text-gray-300 border-white/10 bg-white/[0.03]",
                dot: "bg-gray-400",
              };

            const risk = riskConfig(project.risk_level);

            const gapPercent = calculateGap(
              project.planned_effort,
              project.predicted_effort
            );

            const hasAnalysis = project.predicted_effort != null;

            return (
              <article
                key={project.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071021]/65 p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#22D3EE]/20 hover:bg-[#0a1628]/75 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_35px_rgba(34,211,238,0.06)]"
              >
                {/* Card glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#22D3EE]/[0.045] blur-3xl transition-all duration-500 group-hover:bg-[#22D3EE]/[0.09]" />

                <div className="pointer-events-none absolute -bottom-20 -left-16 h-32 w-32 rounded-full bg-[var(--nexus-violet)]/[0.035] blur-3xl transition-all duration-500 group-hover:bg-[var(--nexus-violet)]/[0.07]" />

                {/* Reflection */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />

                <div className="relative">
                  {/* =================================================
                      TOP ROW
                  ================================================= */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-xl bg-[#22D3EE]/20 blur-md opacity-0 transition group-hover:opacity-100" />

                        <img
                          src="/nexus-logo.jpg"
                          alt="NEXUS AI"
                          className="relative h-10 w-10 rounded-xl border border-white/10 object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-['Space_Grotesk',sans-serif] text-[15px] font-semibold text-white transition group-hover:text-[#67E8F9]">
                          {project.name}
                        </h3>

                        <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">
                          NEXUS / PROJECT{" "}
                          {String(project.id).padStart(3, "0")}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold ${status.color}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                      />

                      {status.label}
                    </span>
                  </div>

                  {/* =================================================
                      DESCRIPTION
                  ================================================= */}
                  <div className="mt-5 min-h-[42px]">
                    <p className="line-clamp-2 text-xs leading-5 text-gray-500">
                      {project.description ||
                        "Aucune description disponible pour ce projet."}
                    </p>
                  </div>

                  {/* =================================================
                      PROJECT METRICS
                  ================================================= */}
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
                      <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                        Durée
                      </p>

                      <p className="mt-1 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-gray-200">
                        {project.length}

                        <span className="ml-1 text-[10px] font-normal text-gray-500">
                          mois
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
                      <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                        Effort
                      </p>

                      <p className="mt-1 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-gray-200">
                        {project.planned_effort}

                        <span className="ml-1 text-[10px] font-normal text-gray-500">
                          heures
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      NEXUS AI RISK
                  ================================================= */}
                  <div
                    className={`mt-3 rounded-xl border ${risk.border} ${risk.bg} p-3 ${risk.glow}`}
                  >
                    {/* Risk header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${risk.border}`}
                        >
                          <span
                            className={`text-xs font-bold ${risk.color}`}
                          >
                            {risk.icon}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                            NEXUS AI
                          </p>

                          <p
                            className={`mt-0.5 truncate text-[10px] font-semibold ${risk.color}`}
                          >
                            {risk.label}
                          </p>
                        </div>
                      </div>

                      {/* Gap */}
                      {gapPercent !== null && (
                        <div className="text-right">
                          <p className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">
                            {gapPercent > 0 ? "+" : ""}
                            {gapPercent.toFixed(1)}%
                          </p>

                          <p className="font-mono text-[7px] uppercase tracking-wider text-gray-600">
                            Effort gap
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI effort summary */}
                    {project.predicted_effort != null && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-white/[0.05] bg-black/10 px-2.5 py-2">
                          <p className="font-mono text-[7px] uppercase tracking-wider text-gray-600">
                            Planifié
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-300">
                            {project.planned_effort} h
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/[0.05] bg-black/10 px-2.5 py-2">
                          <p className="font-mono text-[7px] uppercase tracking-wider text-gray-600">
                            Prédit par IA
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${risk.color}`}
                          >
                            {project.predicted_effort.toFixed(1)} h
                          </p>
                        </div>
                      </div>
                    )}

                    {/* =================================================
                        ANALYSIS BUTTON
                    ================================================= */}
                    <button
                      type="button"
                      onClick={() => onViewRisk(project)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400 transition-all duration-200 hover:border-[#22D3EE]/25 hover:bg-[#22D3EE]/[0.05] hover:text-[#67E8F9]"
                    >
                      <span>✦</span>

                      <span>
                        {hasAnalysis
                          ? "Voir l'analyse IA"
                          : "Analyse en attente"}
                      </span>

                      <span>→</span>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">
                      NEXUS Intelligence Engine
                    </span>

                    <span className="flex items-center gap-1.5 text-[9px] font-medium text-gray-600">
                      <span className="h-1 w-1 rounded-full bg-[#22D3EE]/60" />

                      AI enabled
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          AI ANALYSIS MODAL
      ========================================================= */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto overflow-hidden rounded-3xl border border-white/[0.1] bg-[#071021]/95 shadow-[0_25px_100px_rgba(0,0,0,0.6),0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#22D3EE]/[0.08] blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--nexus-violet)]/[0.08] blur-3xl" />

            {/* Reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/50 to-transparent" />

            <div className="relative p-6 sm:p-8">
              {/* =====================================================
                  MODAL HEADER
              ===================================================== */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/nexus-logo.jpg"
                    alt="NEXUS AI"
                    className="h-11 w-11 rounded-xl border border-white/10 object-cover shadow-[0_0_25px_rgba(34,211,238,0.12)]"
                  />

                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#67E8F9]">
                      NEXUS AI
                    </p>

                    <h3 className="mt-1 font-['Space_Grotesk',sans-serif] text-lg font-semibold text-white">
                      Risk Intelligence
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setSelectedProject(null)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-gray-500 transition hover:border-white/15 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* =====================================================
                  PROJECT
              ===================================================== */}
              <div className="mt-7">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-gray-600">
                  Project
                </p>

                <h2 className="mt-1 break-words font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white">
                  {selectedProject.name}
                </h2>
              </div>

              {/* =====================================================
                  RISK LEVEL
              ===================================================== */}
              {(() => {
                const modalRisk = riskConfig(
                  selectedProject.risk_level
                );

                return (
                  <div
                    className={`mt-6 rounded-2xl border ${modalRisk.border} ${modalRisk.bg} p-5 ${modalRisk.glow}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-gray-600">
                          AI Risk Level
                        </p>

                        <p
                          className={`mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold ${modalRisk.color}`}
                        >
                          {modalRisk.label}
                        </p>
                      </div>

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${modalRisk.border}`}
                      >
                        <span
                          className={`text-lg font-bold ${modalRisk.color}`}
                        >
                          {modalRisk.icon}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* =====================================================
                  METRICS
              ===================================================== */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Effort planifié */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                    Effort planifié
                  </p>

                  <p className="mt-2 font-['Space_Grotesk',sans-serif] text-xl font-bold text-white">
                    {selectedProject.planned_effort}

                    <span className="ml-1 text-xs font-normal text-gray-500">
                      h
                    </span>
                  </p>
                </div>

                {/* Effort prédit */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                    Effort prédit
                  </p>

                  <p className="mt-2 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#67E8F9]">
                    {selectedProject.predicted_effort != null
                      ? selectedProject.predicted_effort.toFixed(1)
                      : "—"}

                    <span className="ml-1 text-xs font-normal text-gray-500">
                      h
                    </span>
                  </p>
                </div>
              </div>

              {/* =====================================================
                  GAP
              ===================================================== */}
              <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                      Effort gap
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Différence estimée entre la planification et la
                      prédiction IA.
                    </p>
                  </div>

                  {(() => {
                    const gap = calculateGap(
                      selectedProject.planned_effort,
                      selectedProject.predicted_effort
                    );

                    return (
                      <p
                        className={`shrink-0 font-['Space_Grotesk',sans-serif] text-2xl font-bold ${
                          (gap ?? 0) > 0
                            ? "text-[#F2497A]"
                            : "text-emerald-300"
                        }`}
                      >
                        {gap !== null
                          ? `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%`
                          : "—"}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* =====================================================
                  AI ASSESSMENT
              ===================================================== */}
              <div className="mt-4 rounded-2xl border border-[#22D3EE]/10 bg-[#22D3EE]/[0.025] p-4">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-[#22D3EE]">✦</span>

                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-wider text-[#67E8F9]">
                      AI Assessment
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {(() => {
                        const gap = calculateGap(
                          selectedProject.planned_effort,
                          selectedProject.predicted_effort
                        );

                        if (gap !== null && gap > 0) {
                          return `NEXUS AI estime que l'effort nécessaire dépasse de ${gap.toFixed(
                            1
                          )}% l'effort initialement planifié. Une attention particulière est recommandée sur la charge et la planification du projet.`;
                        }

                        if (gap !== null && gap <= 0) {
                          return "NEXUS AI estime que l'effort prédit reste dans la limite de l'effort planifié. Le projet présente actuellement une situation favorable.";
                        }

                        return "L'analyse NEXUS AI est disponible, mais les données d'effort prédit ne sont pas encore disponibles.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  MODAL FOOTER
              ===================================================== */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-gray-700">
                  NEXUS Intelligence Engine
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="rounded-xl border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-4 py-2 text-[9px] font-semibold uppercase tracking-wider text-[#67E8F9] transition hover:border-[#22D3EE]/30 hover:bg-[#22D3EE]/[0.08]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

