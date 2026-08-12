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

const STATUS_LABEL: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
};

function riskColor(level: string | null) {
  if (level === "Eleve") return "bg-[#F2497A]/10 text-[#F2497A]";
  if (level === "Moyen") return "bg-amber-50 text-amber-600";
  if (level === "Faible") return "bg-[#16B378]/10 text-[#16B378]";
  return "bg-gray-100 text-gray-400";
}

export default function ProjectsGrid({ projects }: { projects: ProjectItem[] }) {
  if (projects.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-800">
        <p className="text-sm text-gray-400">Aucun projet pour l'instant — cliquez sur « + Projet » pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <div key={p.id} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">{p.name}</h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </div>
          {p.description && <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{p.description}</p>}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>{p.length} mois · {p.planned_effort}h prévues</span>
          </div>

          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${riskColor(p.risk_level)}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {p.risk_score !== null ? `Risque ${p.risk_level} (${p.risk_score}/100)` : "Risque non encore calculé"}
          </div>
        </div>
      ))}
    </div>
  );
}