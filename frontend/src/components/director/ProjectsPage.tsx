import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Search,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";

import {
  getDirectorProjects,
  type DirectorProject,
} from "../../services/directorProjects";
import { statusLabel } from "../ui-nexus/kit";

import NexusAvatar from "../ui-nexus/Avatar";
export default function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<DirectorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const data = await getDirectorProjects();

        setProjects(data);
      } catch (err) {
        console.error("Erreur chargement projets :", err);

        setError(
          t("director.projects.loadError")
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [t]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        project.name.toLowerCase().includes(searchValue) ||
        project.description?.toLowerCase().includes(searchValue) ||
        `${project.chef_de_projet?.first_name} ${project.chef_de_projet?.last_name}`
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(project.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const activeProjects = projects.filter(
    (project) => normalizeStatus(project.status) === "active"
  ).length;

  const completedProjects = projects.filter(
    (project) => normalizeStatus(project.status) === "completed"
  ).length;

  const highRiskProjects = projects.filter(
    (project) =>
      project.risk_score !== null && project.risk_score >= 70
  ).length;

  return (
    <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -start-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        <div className="absolute end-[-180px] top-[10%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.07] blur-[130px]" />

        <div className="absolute bottom-[-200px] start-[35%] h-[450px] w-[450px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
      </div>

      <div className="relative px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  NEXUS • {t("director.sidebar.projects")}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("director.projects.title1")}{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  {t("director.projects.title2")}
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                {t("director.projects.subtitle")}
              </p>
            </div>
          </header>

          {/* Stats */}
          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon={<FolderKanban className="h-4 w-4" />}
              label={t("director.projects.total")}
              value={projects.length}
              accent="cyan"
            />

            <StatCard
              icon={<Clock3 className="h-4 w-4" />}
              label={t("common.projectStatus.en_cours")}
              value={activeProjects}
              accent="violet"
            />

            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={t("director.projects.completed")}
              value={completedProjects}
              accent="emerald"
            />

            <StatCard
              icon={<ShieldAlert className="h-4 w-4" />}
              label={t("director.projects.highRisk")}
              value={highRiskProjects}
              accent="red"
            />
          </div>

          {/* Search */}
          <section className="mb-7 rounded-3xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row">

              <div className="relative flex-1">
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("director.projects.search")}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#020817]/70 ps-11 pe-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-xl border border-white/10 bg-[#020817]/70 px-4 text-sm text-white outline-none focus:border-violet-400/40"
              >
                <option value="all" className="bg-[#020817]">
                  {t("director.projects.allStatuses")}
                </option>

                <option value="planned" className="bg-[#020817]">
                  {t("director.projects.planned")}
                </option>

                <option value="active" className="bg-[#020817]">
                  {t("common.projectStatus.en_cours")}
                </option>

                <option value="completed" className="bg-[#020817]">
                  {t("director.projects.completed")}
                </option>
              </select>
            </div>
          </section>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] py-24 backdrop-blur-xl">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

              <p className="mt-4 text-sm text-slate-500">
                {t("director.projects.loading")}
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.04] p-8 text-center">
              <XCircle className="mx-auto h-8 w-8 text-red-400" />

              <p className="mt-4 text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredProjects.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-20 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <FolderKanban className="h-6 w-6 text-slate-600" />
              </div>

              <h3 className="mt-5 text-sm font-semibold text-slate-300">
                {t("director.projects.notFound")}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                {t("director.projects.notFoundHint")}
              </p>
            </div>
          )}

          {/* Projects */}
          {!loading && !error && filteredProjects.length > 0 && (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDetails={() =>
                    navigate(
                      `/dashboard/direction/projects/${project.id}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROJECT CARD
========================================================= */

type ProjectCardProps = {
  project: DirectorProject;
  onDetails: () => void;
};

function ProjectCard({
  project,
  onDetails,
}: ProjectCardProps) {
  const { t } = useTranslation();
  const status = getStatusInfo(project.status);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.045]">
      <div className="absolute end-[-80px] top-[-100px] h-64 w-64 rounded-full bg-cyan-500/[0.05] blur-3xl transition group-hover:bg-cyan-500/[0.08]" />

      <div className="relative p-6">

        {/* Top */}
        <div className="flex items-start justify-between gap-4">

          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
              <BriefcaseBusiness className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">
                {project.name}
              </h2>

              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {project.description || t("director.projects.noDescription")}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Chef */}
        <div className="mt-7 border-t border-white/[0.06] pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {t("common.roles.chef_de_projet")}
          </p>

          <div className="flex items-center gap-3">
            <Avatar
              member={project.chef_de_projet}
              cyan
            />

            <div>
              <p className="text-sm font-medium text-slate-200">
                {project.chef_de_projet.first_name}{" "}
                {project.chef_de_projet.last_name}
              </p>

              <p className="text-xs text-slate-600">
                {project.chef_de_projet.job_title ||
                  t("common.roles.chef_de_projet")}
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {t("director.sidebar.team")}
            </p>

            <span className="flex items-center gap-1 text-xs text-slate-600">
              <Users className="h-3.5 w-3.5" />
              {t("director.projects.memberCount", { count: project.team.length })}
            </span>
          </div>

          {project.team.length > 0 ? (
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {project.team.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.id}
                    member={member}
                  />
                ))}
              </div>

              {project.team.length > 5 && (
                <span className="ms-3 text-xs text-slate-500">
                  +{project.team.length - 5}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              {t("chef.trackingPage.noAssigned")}
            </p>
          )}
        </div>

        {/* Risk */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {t("director.projects.risk")}
            </span>

            <span
              className={`text-sm font-semibold ${
                getRiskColor(project.risk_score)
              }`}
            >
              {project.risk_score !== null
                ? `${project.risk_score}%`
                : t("director.projects.na")}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all ${getRiskBarColor(
                project.risk_score
              )}`}
              style={{
                width: `${Math.min(
                  Math.max(project.risk_score ?? 0, 0),
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 border-t border-white/[0.06] pt-5">
          <button
            onClick={onDetails}
            className="group/button flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.05] hover:text-cyan-300"
          >
            {t("director.projects.details")}

            <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1 rtl:rotate-180 rtl:group-hover/button:-translate-x-1" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   AVATAR
========================================================= */

type AvatarProps = {
  member: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_path: string | null;
    avatar_color?: string | null;
  };
  cyan?: boolean;
};

function Avatar({ member, cyan = false }: AvatarProps) {

  return (
    <div
      title={`${member.first_name} ${member.last_name}`}
      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#020817] ${
        cyan
          ? "bg-gradient-to-br from-cyan-400/30 to-blue-500/20"
          : "bg-gradient-to-br from-violet-400/20 to-blue-500/20"
      }`}
    >
      <NexusAvatar person={member} rounded="rounded-none" ring={false} className="h-full! w-full!" />
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "cyan" | "violet" | "emerald" | "red";
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: StatCardProps) {
  const styles = {
    cyan: {
      icon: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
      glow: "bg-cyan-500/[0.05]",
    },
    violet: {
      icon: "border-violet-400/20 bg-violet-400/10 text-violet-300",
      glow: "bg-violet-500/[0.05]",
    },
    emerald: {
      icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      glow: "bg-emerald-500/[0.05]",
    },
    red: {
      icon: "border-red-400/20 bg-red-400/10 text-red-300",
      glow: "bg-red-500/[0.05]",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div
        className={`absolute -end-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles[accent].glow}`}
      />

      <div className="relative">
        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${styles[accent].icon}`}
        >
          {icon}
        </div>

        <p className="text-xs text-slate-600">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(status: string) {
  const value = status.toLowerCase().trim();

  if (
    [
      "en_cours",
      "in_progress",
      "in-progress",
      "active",
      "ongoing",
    ].includes(value)
  ) {
    return "active";
  }

  if (
    [
      "termine",
      "terminé",
      "completed",
      "complete",
      "finished",
      "done",
    ].includes(value)
  ) {
    return "completed";
  }

  return "planned";
}

function getStatusInfo(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "active") {
    return {
      label: statusLabel("en_cours"),
      className:
        "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300",
    };
  }

  if (normalized === "completed") {
    return {
      label: statusLabel("termine"),
      className:
        "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
    };
  }

  return {
    label: statusLabel("planifie"),
    className:
      "border-violet-400/15 bg-violet-400/[0.06] text-violet-300",
  };
}

function getRiskColor(score: number | null) {
  if (score === null) return "text-slate-500";
  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-amber-300";
  return "text-emerald-300";
}

function getRiskBarColor(score: number | null) {
  if (score === null) return "bg-slate-700";
  if (score >= 70) return "bg-red-400";
  if (score >= 40) return "bg-amber-300";
  return "bg-emerald-400";
}