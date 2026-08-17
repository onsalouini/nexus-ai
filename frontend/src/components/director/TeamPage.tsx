import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  getDirectorTeam,
  getTeamMember,
  type TeamLeader,
  type TeamMember,
  type TeamMemberDetails,
} from "../../services/directorTeam";

export default function TeamPage() {
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [selectedMember, setSelectedMember] =
    useState<TeamMemberDetails | null>(null);

  const [loadingMember, setLoadingMember] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
      setError("");

      const data = await getDirectorTeam();

      setLeaders(data);

      if (data.length > 0) {
        setExpanded(data[0].id);
      }
    } catch (err) {
      console.error("Erreur chargement équipe :", err);
      setError("Impossible de charger l'équipe.");
    } finally {
      setLoading(false);
    }
  }

  async function openMember(member: TeamMember) {
    try {
      setLoadingMember(true);

      const data = await getTeamMember(member.id);

      setSelectedMember(data);
    } catch (err) {
      console.error("Erreur chargement membre :", err);
    } finally {
      setLoadingMember(false);
    }
  }

  const normalizedSearch = search.toLowerCase().trim();

  const filteredLeaders = leaders
    .map((leader) => {
      const leaderMatches =
        `${leader.first_name} ${leader.last_name}`
          .toLowerCase()
          .includes(normalizedSearch) ||
        leader.email.toLowerCase().includes(normalizedSearch);

      const filteredMembers = leader.team_members.filter((member) =>
        `${member.first_name} ${member.last_name} ${member.email} ${
          member.job_title ?? ""
        }`
          .toLowerCase()
          .includes(normalizedSearch)
      );

      if (!normalizedSearch) {
        return {
          ...leader,
          team_members: leader.team_members,
        };
      }

      if (leaderMatches) {
        return {
          ...leader,
          team_members: leader.team_members,
        };
      }

      if (filteredMembers.length > 0) {
        return {
          ...leader,
          team_members: filteredMembers,
        };
      }

      return null;
    })
    .filter(Boolean) as TeamLeader[];

  const totalMembers = leaders.reduce(
    (total, leader) => total + leader.team_members.length,
    0
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        <div className="absolute right-[-180px] top-[10%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.07] blur-[130px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[450px] w-[450px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
      </div>

      <div className="relative px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  NEXUS • Organization
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Équipe
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Visualisez les chefs de projet et les collaborateurs
                de votre entreprise.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un membre..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-xl placeholder:text-slate-700 transition focus:border-cyan-400/30 focus:bg-white/[0.05]"
              />
            </div>
          </div>

          {/* STATS */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Collaborateurs"
              value={totalMembers}
            />

            <StatCard
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              label="Chefs de projet"
              value={leaders.length}
            />

            <StatCard
              icon={<ShieldAlert className="h-4 w-4" />}
              label="Équipes"
              value={leaders.length}
            />
          </div>

          {/* CONTENT */}
          <div className="mt-8">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={loadTeam} />
            ) : filteredLeaders.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              <div className="space-y-5">
                {filteredLeaders.map((leader) => (
                  <TeamLeaderCard
                    key={leader.id}
                    leader={leader}
                    expanded={expanded === leader.id}
                    onToggle={() =>
                      setExpanded(
                        expanded === leader.id ? null : leader.id
                      )
                    }
                    onMemberClick={openMember}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MEMBER MODAL */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Loading member */}
      {loadingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#06101f] px-6 py-5">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

            <p className="mt-3 text-sm text-slate-500">
              Chargement du profil...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TEAM LEADER CARD
========================================================= */

function TeamLeaderCard({
  leader,
  expanded,
  onToggle,
  onMemberClick,
}: {
  leader: TeamLeader;
  expanded: boolean;
  onToggle: () => void;
  onMemberClick: (member: TeamMember) => void;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl">
      {/* Leader header */}
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            member={leader}
            size="large"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                {leader.first_name} {leader.last_name}
              </h2>

              <span className="rounded-full border border-violet-400/15 bg-violet-400/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                Chef de projet
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>
                {leader.job_title || "Chef de projet"}
              </span>

              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {leader.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-lg font-semibold text-white">
              {leader.team_members.length}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-slate-700">
              membres
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 transition group-hover:border-cyan-400/20 group-hover:text-cyan-300">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {/* Team */}
      {expanded && (
        <div className="border-t border-white/[0.06]">
          {leader.team_members.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-7 w-7 text-slate-700" />

              <p className="mt-3 text-sm text-slate-600">
                Aucun membre n'est actuellement affecté à cette équipe.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
              {leader.team_members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onClick={() => onMemberClick(member)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MEMBER CARD
========================================================= */

function MemberCard({
  member,
  onClick,
}: {
  member: TeamMember;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.035]"
    >
      <div className="flex items-center gap-3">
        <Avatar member={member} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200 transition group-hover:text-white">
            {member.first_name} {member.last_name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-600">
            {member.job_title || "Collaborateur"}
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-slate-700 transition group-hover:border-cyan-400/15 group-hover:text-cyan-300">
          <UserRound className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.05] pt-3">
        <Mail className="h-3 w-3 shrink-0 text-slate-700" />

        <span className="truncate text-[11px] text-slate-700">
          {member.email}
        </span>

        <span className="ml-auto text-[10px] font-medium text-cyan-500 opacity-0 transition group-hover:opacity-100">
          Profil →
        </span>
      </div>
    </button>
  );
}

/* =========================================================
   MEMBER DETAILS MODAL
========================================================= */

function MemberDetailsModal({
  member,
  onClose,
}: {
  member: TeamMemberDetails;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#06101f] shadow-2xl"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/[0.08] blur-3xl" />

        {/* Header */}
        <div className="relative border-b border-white/[0.06] p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 transition hover:border-red-400/20 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4 pr-10">
            <Avatar member={member} size="large" />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {member.first_name} {member.last_name}
                </h2>

                <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wider text-cyan-300">
                  {member.role}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {member.job_title || "Collaborateur"}
              </p>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <Mail className="h-3 w-3" />
                {member.email}
              </div>
            </div>
          </div>
        </div>

        <div className="relative space-y-6 p-6 sm:p-8">
          {/* Informations */}
          <div>
            <SectionTitle
              icon={<UserRound className="h-4 w-4" />}
              title="Informations"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Nom complet"
                value={`${member.first_name} ${member.last_name}`}
              />

              <DetailItem
                label="Poste"
                value={member.job_title || "Non renseigné"}
              />

              <DetailItem
                label="Email"
                value={member.email}
              />

              <DetailItem
                label="Rôle"
                value={formatRole(member.role)}
              />
            </div>
          </div>

          {/* Manager */}
          <div>
            <SectionTitle
              icon={<Users className="h-4 w-4" />}
              title="Chef de projet"
            />

            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              {member.manager ? (
                <div className="flex items-center gap-3">
                  <Avatar member={member.manager} />

                  <div>
                    <p className="text-sm font-medium text-white">
                      {member.manager.first_name}{" "}
                      {member.manager.last_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {member.manager.job_title ||
                        "Chef de projet"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Aucun chef de projet associé.
                </p>
              )}
            </div>
          </div>

          {/* CV */}
          <div>
            <SectionTitle
              icon={<FileText className="h-4 w-4" />}
              title="Documents"
            />

            <div className="mt-4">
              {member.cv_path ? (
                <a
                  href={member.cv_path}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.05]">
                      <FileText className="h-4 w-4 text-red-300" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        Curriculum Vitae
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Consulter le CV du collaborateur
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-cyan-400 transition group-hover:text-cyan-300">
                    Voir le CV →
                  </span>
                </a>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm text-slate-600">
                    Aucun CV disponible.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <SectionTitle
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              title="Projets"
            />

            <div className="mt-4 space-y-3">
              {member.projects.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                  <BriefcaseBusiness className="mx-auto h-6 w-6 text-slate-700" />

                  <p className="mt-2 text-sm text-slate-600">
                    Aucun projet associé.
                  </p>
                </div>
              ) : (
                member.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {project.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {formatStatus(project.status)}
                      </p>
                    </div>

                    {project.risk_score !== null && (
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-700">
                          Risk
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${getRiskColor(
                            project.risk_score
                          )}`}
                        >
                          {project.risk_score}%
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  member,
  size = "normal",
}: {
  member: {
    first_name: string;
    last_name: string;
    avatar_path: string | null;
  };
  size?: "normal" | "large";
}) {
  const initials =
    `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();

  const sizeClass =
    size === "large"
      ? "h-14 w-14 rounded-2xl text-base"
      : "h-10 w-10 rounded-xl text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-cyan-400/10 bg-cyan-400/[0.06] ${sizeClass}`}
    >
      {member.avatar_path ? (
        <img
          src={member.avatar_path}
          alt={`${member.first_name} ${member.last_name}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-bold text-cyan-300">
          {initials}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="text-cyan-300">{icon}</span>

        <span className="text-xs uppercase tracking-wider text-slate-600">
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
        {icon}
      </div>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-700">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   STATES
========================================================= */

function LoadingState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

      <p className="mt-4 text-sm text-slate-600">
        Chargement de l'organisation...
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.03] p-12 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-red-400" />

      <h2 className="mt-4 text-lg font-semibold text-white">
        Impossible de charger l'équipe
      </h2>

      <p className="mt-2 text-sm text-red-300">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/20 hover:text-cyan-300"
      >
        Réessayer
      </button>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">
      <Users className="mx-auto h-9 w-9 text-slate-700" />

      <h2 className="mt-4 text-lg font-semibold text-white">
        {search
          ? "Aucun résultat"
          : "Aucun chef de projet"}
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        {search
          ? "Aucun membre ne correspond à votre recherche."
          : "Les équipes apparaîtront ici une fois configurées."}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatRole(role: string) {
  switch (role) {
    case "chef_de_projet":
      return "Chef de projet";

    case "agent_support":
      return "Agent support";

    case "direction":
      return "Direction";

    default:
      return role;
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "en_cours":
      return "En cours";

    case "termine":
    case "terminé":
      return "Terminé";

    case "planifie":
      return "Planifié";

    default:
      return status;
  }
}

function getRiskColor(score: number) {
  if (score >= 70) {
    return "text-red-400";
  }

  if (score >= 40) {
    return "text-amber-300";
  }

  return "text-emerald-300";
}