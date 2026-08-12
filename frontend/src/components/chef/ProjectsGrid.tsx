type ProjectItem = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  length: number;
  planned_effort: number;
  risk_score: number | null;
  risk_level: string | null;
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
  if (level === "Eleve") {
    return {
      label: "Risque élevé",
      color: "text-[#F2497A]",
      bg: "bg-[#F2497A]/[0.07]",
      border: "border-[#F2497A]/20",
      bar: "bg-[#F2497A]",
      glow: "shadow-[0_0_12px_rgba(242,73,122,0.35)]",
    };
  }

  if (level === "Moyen") {
    return {
      label: "Risque moyen",
      color: "text-amber-300",
      bg: "bg-amber-400/[0.06]",
      border: "border-amber-400/20",
      bar: "bg-amber-400",
      glow: "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
    };
  }

  if (level === "Faible") {
    return {
      label: "Risque faible",
      color: "text-emerald-300",
      bg: "bg-emerald-400/[0.06]",
      border: "border-emerald-400/20",
      bar: "bg-emerald-400",
      glow: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    };
  }

  return {
    label: "Analyse en attente",
    color: "text-gray-400",
    bg: "bg-white/[0.03]",
    border: "border-white/[0.08]",
    bar: "bg-white/20",
    glow: "",
  };
}

function riskWidth(score: number | null) {
  if (score === null) return 0;
  return Math.min(Math.max(score, 0), 100);
}

export default function ProjectsGrid({
  projects,
}: {
  projects: ProjectItem[];
}) {
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

      {/* Projects */}
      <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const status =
            STATUS_CONFIG[project.status] ?? {
              label: project.status,
              color: "text-gray-300 border-white/10 bg-white/[0.03]",
              dot: "bg-gray-400",
            };

          const risk = riskConfig(project.risk_level);
          const score = riskWidth(project.risk_score);

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
                {/* Top row */}
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
                        NEXUS / PROJECT {String(project.id).padStart(3, "0")}
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

                {/* Description */}
                <div className="mt-5 min-h-[42px]">
                  <p className="line-clamp-2 text-xs leading-5 text-gray-500">
                    {project.description ||
                      "Aucune description disponible pour ce projet."}
                  </p>
                </div>

                {/* Metrics */}
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

                {/* Risk intelligence */}
                <div
                  className={`mt-3 rounded-xl border ${risk.border} ${risk.bg} p-3 ${risk.glow}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-lg border ${risk.border} flex items-center justify-center`}
                      >
                        <span className={`h-2 w-2 rounded-full ${risk.bar}`} />
                      </div>

                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-gray-600">
                          AI Risk Analysis
                        </p>
                        <p className={`mt-0.5 text-[10px] font-semibold ${risk.color}`}>
                          {risk.label}
                        </p>
                      </div>
                    </div>

                    <span className={`font-['Space_Grotesk',sans-serif] text-lg font-bold ${risk.color}`}>
                      {project.risk_score !== null
                        ? project.risk_score
                        : "—"}
                      {project.risk_score !== null && (
                        <span className="ml-0.5 text-[9px] font-normal opacity-60">
                          /100
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Risk bar */}
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${risk.bar} transition-all duration-700`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">
                    NEXUS Intelligence Engine
                  </span>

                  <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500 transition group-hover:text-[#67E8F9]">
                    <span>Voir détails</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
