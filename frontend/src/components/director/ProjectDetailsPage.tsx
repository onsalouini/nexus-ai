import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  
  Clock3,
  Mail,
  ShieldAlert,
  Users,
} from "lucide-react";

import {
  getDirectorProject,
  type DirectorProject,
} from "../../services/directorProjects";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<DirectorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      if (!id) return;

      try {
        setLoading(true);

        const data = await getDirectorProject(Number(id));

        setProject(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger ce projet.");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#020817]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-full bg-[#020817] px-6 py-10 text-white">
        <button
          onClick={() => navigate("/dashboard/direction/projects")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux projets
        </button>

        <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-400/[0.04] p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-red-400" />

          <p className="mt-4 text-sm text-red-300">
            {error || "Projet introuvable."}
          </p>
        </div>
      </div>
    );
  }

  const status = getStatusInfo(project.status);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        <div className="absolute right-[-180px] top-[10%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.07] blur-[130px]" />
      </div>

      <div className="relative px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl">

          {/* Back */}
          <button
            onClick={() =>
              navigate("/dashboard/direction/projects")
            }
            className="mb-7 flex items-center gap-2 text-sm text-slate-500 transition hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux projets
          </button>

          {/* Header */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-2xl">
            <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-cyan-500/[0.07] blur-3xl" />

            <div className="relative p-6 sm:p-8">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08]">
                    <BriefcaseBusiness className="h-6 w-6 text-cyan-300" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                        NEXUS • Project
                      </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                      {project.name}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                      {project.description ||
                        "Aucune description disponible."}
                    </p>
                  </div>
                </div>

                <span
                  className={`self-start rounded-full border px-4 py-2 text-xs font-medium ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
            </div>
          </section>

          {/* Stats */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <InfoCard
              icon={<Clock3 className="h-4 w-4" />}
              label="Statut"
              value={status.label}
            />

            <InfoCard
              icon={<ShieldAlert className="h-4 w-4" />}
              label="Risk Score"
              value={
                project.risk_score !== null
                  ? `${project.risk_score}%`
                  : "N/A"
              }
            />

            <InfoCard
              icon={<Users className="h-4 w-4" />}
              label="Équipe"
              value={`${project.team.length} membre${
                project.team.length > 1 ? "s" : ""
              }`}
            />
          </div>

          {/* Main */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">

            {/* Chef */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
                  <BriefcaseBusiness className="h-4 w-4 text-violet-300" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    Chef de projet
                  </h2>

                  <p className="text-xs text-slate-600">
                    Responsable du projet
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
                <div className="flex items-center gap-3">

                  <Avatar member={project.chef_de_projet} />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {project.chef_de_projet.first_name}{" "}
                      {project.chef_de_projet.last_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {project.chef_de_projet.job_title ||
                        "Chef de projet"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="h-3.5 w-3.5" />
                  {project.chef_de_projet.email}
                </div>
              </div>
            </section>

            {/* Team */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl lg:col-span-2">

              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                    <Users className="h-4 w-4 text-cyan-300" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">
                      Équipe du projet
                    </h2>

                    <p className="text-xs text-slate-600">
                      Membres affectés à ce projet
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-600">
                  {project.team.length} membre
                  {project.team.length > 1 ? "s" : ""}
                </span>
              </div>

              {project.team.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-6 py-10 text-center">
                  <Users className="mx-auto h-6 w-6 text-slate-700" />

                  <p className="mt-3 text-sm text-slate-600">
                    Aucun membre n'est actuellement affecté.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {project.team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-4 transition hover:border-cyan-400/15 hover:bg-white/[0.02]"
                    >
                      <Avatar member={member} />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {member.first_name}{" "}
                          {member.last_name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-600">
                          {member.job_title || "Membre de l'équipe"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Project information */}
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
                <CalendarDays className="h-4 w-4 text-blue-300" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Informations du projet
                </h2>

                <p className="text-xs text-slate-600">
                  Données utilisées par NEXUS Intelligence
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <Metric
                label="Durée prévue"
                value={`${project.length} mois`}
              />

              <Metric
                label="Effort prévu"
                value={`${project.planned_effort} h`}
              />

              <Metric
                label="Effort prédit"
                value={
                  project.predicted_effort !== null
                    ? `${project.predicted_effort} h`
                    : "N/A"
                }
              />

              <Metric
                label="Risque"
                value={
                  project.risk_level
                    ? project.risk_level
                    : "Non calculé"
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Avatar({
  member,
}: {
  member: {
    first_name: string;
    last_name: string;
    avatar_path: string | null;
  };
}) {
  const initials =
    `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06]">
      {member.avatar_path ? (
        <img
          src={member.avatar_path}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-bold text-cyan-300">
          {initials}
        </span>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}
        <span className="text-xs uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-3 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold capitalize text-slate-200">
        {value}
      </p>
    </div>
  );
}

function getStatusInfo(status: string) {
  const value = status.toLowerCase();

  if (
    ["en_cours", "in_progress", "in-progress", "active", "ongoing"].includes(
      value
    )
  ) {
    return {
      label: "En cours",
      className:
        "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300",
    };
  }

  if (
    ["termine", "terminé", "completed", "finished", "done"].includes(
      value
    )
  ) {
    return {
      label: "Terminé",
      className:
        "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
    };
  }

  return {
    label: "Planifié",
    className:
      "border-violet-400/15 bg-violet-400/[0.06] text-violet-300",
  };
}