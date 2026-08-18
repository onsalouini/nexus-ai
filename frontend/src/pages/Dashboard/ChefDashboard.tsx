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

  team_exp: number;
  manager_exp: number;
  length: number;
  transactions: number;
  entities: number;
  points_non_adjust: number;
  adjustment: number;
  language: number;

  planned_effort: number;
  predicted_effort?: number | null;

  risk_score?: number | null;
  risk_level: string | null;

  ai_report?: {
    summary: string;
    health: "Bonne" | "Moyenne" | "Préoccupante" | "Critique";
    strengths: string[];
    risks: {
      title: string;
      description: string;
      severity: "Faible" | "Modérée" | "Élevée" | "Critique";
    }[];
    recommendations: string[];
    effort_analysis: string;
    final_verdict: string;
  } | null;

  ai_report_generated_at?: string | null;

  created_at?: string;
  updated_at?: string;
};

export default function ChefDashboard() {
  const { refreshKey } =
    useOutletContext<ChefLayoutContext>();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);

      const response =
        await api.get<Project[]>("/projects");

      setProjects(response.data);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des projets :",
        err
      );

      setError(
        "Impossible de charger les projets pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [refreshKey]);

  return (
    <section className="relative">
      {/* =========================================================
          HEADER
      ========================================================== */}

      <div className="mb-9">
        {/* NEXUS label */}

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.035] px-3 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />

            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
          </span>

          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Project Intelligence
          </span>
        </div>

        {/* Title */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-[-0.03em] text-white sm:text-[38px]">
              Mes projets
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Créez et pilotez vos projets tout en obtenant
              une estimation intelligente du risque grâce à
              NEXUS AI.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-3 lg:pb-1">
              <div className="h-8 w-px bg-white/[0.07]" />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  Workspace
                </p>

                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">
                    {projects.length}
                  </span>

                  <span className="text-xs text-white/35">
                    {projects.length === 1
                      ? "projet"
                      : "projets"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}

        <div className="mt-7 h-px bg-gradient-to-r from-cyan-400/[0.12] via-white/[0.05] to-transparent" />
      </div>

      {/* =========================================================
          LOADING
      ========================================================== */}

      {loading && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] px-6 py-16">
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-cyan-400/[0.035] blur-3xl" />

          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl" />

              <div className="relative h-9 w-9 animate-spin rounded-full border-2 border-white/[0.08] border-t-cyan-400" />
            </div>

            <p className="text-sm font-medium text-white/60">
              Chargement de vos projets
            </p>

            <p className="mt-1 text-xs text-white/25">
              NEXUS Intelligence prépare votre espace...
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          ERROR
      ========================================================== */}

      {!loading && error && (
        <div className="relative overflow-hidden rounded-2xl border border-red-400/10 bg-red-500/[0.025] px-6 py-12">
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-red-500/[0.04] blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/15 bg-red-500/[0.05]">
              <span className="text-sm font-semibold text-red-300">
                !
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-red-200">
              Une erreur est survenue
            </p>

            <p className="mt-1 max-w-md text-xs leading-5 text-white/30">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProjects}
              className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-xs font-medium text-white/55 transition-all duration-200 hover:border-cyan-400/20 hover:bg-cyan-400/[0.04] hover:text-white"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          PROJECTS
      ========================================================== */}

      {!loading && !error && (
        <ProjectsGrid projects={projects} />
      )}
    </section>
  );
}