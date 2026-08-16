import { useEffect, useState } from "react";

import { api } from "../../lib/api";
import ProjectsGrid from "../../components/chef/ProjectsGrid.tsx";
import { useOutletContext } from "react-router";

type ChefLayoutContext = {
  refreshKey: number;
};

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  length: number;
  planned_effort: number;
  risk_score: number | null;
  risk_level: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function ChefDashboard() {
  const { refreshKey } = useOutletContext<ChefLayoutContext>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Project[]>("/projects");
      setProjects(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des projets :", err);
      setError("Impossible de charger les projets pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  // Recharge au montage ET à chaque fois qu'un projet est créé
  // (refreshKey change dans ChefLayout après un CreateProjectModal réussi)
  useEffect(() => {
    loadProjects();
  }, [refreshKey]);

  return (
    <>
      {/* HEADER */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-3 py-1.5 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#67E8F9]">
            Project Intelligence
          </span>
        </div>

        <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Mes projets
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Créez et pilotez vos projets tout en obtenant une estimation intelligente du risque grâce à NEXUS AI.
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#22D3EE]" />
          <p className="text-sm text-slate-500">Chargement de vos projets...</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.04] p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadProjects}
            className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 transition hover:border-[#22D3EE]/30 hover:text-white"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* PROJECTS */}
      {!loading && !error && <ProjectsGrid projects={projects} />}
    </>
  );
}