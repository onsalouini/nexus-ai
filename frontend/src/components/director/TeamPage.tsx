import { useTranslation } from "react-i18next";
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
import i18n from "../../i18n";
import { statusLabel } from "../ui-nexus/kit";
import { roleLabel } from "../../i18n/labels";
import { toast } from "../../lib/toast";
import { errMsg } from "../ui-nexus/kit";
import { SkeletonRows } from "../ui-nexus/Skeleton";
import { exportRows } from "../../utils/export";

import NexusAvatar from "../ui-nexus/Avatar";
export default function TeamPage() {
  const { t } = useTranslation();
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
      setError(i18n.t("director.team.loadError"));
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
      // Auparavant silencieux : l'utilisateur ne savait pas pourquoi rien ne s'ouvrait
      toast.error(errMsg(err, t("director.team.profileError")));
    } finally {
      setLoadingMember(false);
    }
  }

  // Export : une ligne par personne (chefs de projet et leurs collaborateurs)
  function exportTeam(format: "csv" | "xlsx") {
    type Row = { first_name: string; last_name: string; email: string; job_title?: string | null; role: string; manager: string };
    const rows: Row[] = leaders.flatMap((leader) => [
      { ...leader, role: "chef_de_projet", manager: "" },
      ...leader.team_members.map((m) => ({
        ...m,
        role: (m as { role?: string }).role ?? "membre_equipe",
        manager: `${leader.first_name} ${leader.last_name}`,
      })),
    ]);
    void exportRows(format, t("director.sidebar.team"), [
      { header: t("auth.signup.step1.firstName"), value: (r: Row) => r.first_name },
      { header: t("chef.editProject.name"), value: (r: Row) => r.last_name },
      { header: t("auth.email"), value: (r: Row) => r.email },
      { header: t("chef.members.job"), value: (r: Row) => r.job_title ?? "" },
      { header: t("director.team.role"), value: (r: Row) => roleLabel(r.role) },
      { header: t("common.roles.chef_de_projet"), value: (r: Row) => r.manager },
    ], rows);
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
        <div className="absolute -start-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        <div className="absolute end-[-180px] top-[10%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.07] blur-[130px]" />

        <div className="absolute bottom-[-200px] start-[35%] h-[450px] w-[450px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
      </div>

      <div className="relative px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  NEXUS • {t("director.home.organization")}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("director.sidebar.team")}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {t("director.team.subtitle")}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <button
              type="button"
              onClick={() => exportTeam("csv")}
              disabled={!leaders.length}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-40"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportTeam("xlsx")}
              disabled={!leaders.length}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-40"
            >
              Excel
            </button>
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("director.team.search")}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 ps-11 pe-4 text-sm text-white outline-none backdrop-blur-xl placeholder:text-slate-700 transition focus:border-cyan-400/30 focus:bg-white/[0.05]"
              />
            </div>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label={t("director.team.collaborators")}
              value={totalMembers}
            />

            <StatCard
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              label={t("director.team.managers")}
              value={leaders.length}
            />

            <StatCard
              icon={<ShieldAlert className="h-4 w-4" />}
              label={t("director.team.teams")}
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
              {t("director.team.loadingProfile")}
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
  const { t } = useTranslation();
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl">
      {/* Leader header */}
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 p-5 text-start transition hover:bg-white/[0.025] sm:p-6"
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
                {t("common.roles.chef_de_projet")}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>
                {leader.job_title || t("common.roles.chef_de_projet")}
              </span>

              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {leader.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-end sm:block">
            <p className="text-lg font-semibold text-white">
              {leader.team_members.length}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-slate-700">
              {t("director.team.members")}
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
                {t("director.team.noMembers")}
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
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-start transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.035]"
    >
      <div className="flex items-center gap-3">
        <Avatar member={member} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200 transition group-hover:text-white">
            {member.first_name} {member.last_name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-600">
            {member.job_title || t("director.team.collaborator")}
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

        <span className="ms-auto text-[10px] font-medium text-cyan-500 opacity-0 transition group-hover:opacity-100">
          {t("director.team.profile")} {i18n.dir() === "rtl" ? "←" : "→"}
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
  const { t } = useTranslation();
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
        <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/[0.08] blur-3xl" />

        {/* Header */}
        <div className="relative border-b border-white/[0.06] p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute end-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 transition hover:border-red-400/20 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4 pe-10">
            <Avatar member={member} size="large" />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {member.first_name} {member.last_name}
                </h2>

                <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wider text-cyan-300">
                  {roleLabel(member.role)}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {member.job_title || t("director.team.collaborator")}
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
              title={t("director.team.information")}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem
                label={t("director.team.fullName")}
                value={`${member.first_name} ${member.last_name}`}
              />

              <DetailItem
                label={t("chef.members.job")}
                value={member.job_title || t("director.home.notProvided")}
              />

              <DetailItem
                label={t("auth.email")}
                value={member.email}
              />

              <DetailItem
                label={t("director.team.role")}
                value={formatRole(member.role)}
              />
            </div>
          </div>

          {/* Manager */}
          <div>
            <SectionTitle
              icon={<Users className="h-4 w-4" />}
              title={t("common.roles.chef_de_projet")}
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
                        t("common.roles.chef_de_projet")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  {t("director.team.noManager")}
                </p>
              )}
            </div>
          </div>

          {/* CV */}
          <div>
            <SectionTitle
              icon={<FileText className="h-4 w-4" />}
              title={t("director.team.documents")}
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
                        {t("director.team.cv")}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {t("director.team.cvHint")}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-cyan-400 transition group-hover:text-cyan-300">
                    {t("director.team.viewCv")}
                  </span>
                </a>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm text-slate-600">
                    {t("director.team.noCv")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <SectionTitle
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              title={t("director.sidebar.projects")}
            />

            <div className="mt-4 space-y-3">
              {member.projects.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                  <BriefcaseBusiness className="mx-auto h-6 w-6 text-slate-700" />

                  <p className="mt-2 text-sm text-slate-600">
                    {t("director.team.noProjects")}
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
                      <div className="shrink-0 text-end">
                        <p className="text-[10px] uppercase tracking-wider text-slate-700">
                          {t("chef.projects.risk")}
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
    avatar_color?: string | null;
  };
  size?: "normal" | "large";
}) {

  const sizeClass =
    size === "large"
      ? "h-14 w-14 rounded-2xl text-base"
      : "h-10 w-10 rounded-xl text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-cyan-400/10 bg-cyan-400/[0.06] ${sizeClass}`}
    >
      <NexusAvatar person={member} rounded="rounded-none" ring={false} className="h-full! w-full! text-inherit" />
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
  const { t } = useTranslation();
  return (
    <div aria-label={t("director.team.loading")}>
      <SkeletonRows count={4} />
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
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.03] p-12 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-red-400" />

      <h2 className="mt-4 text-lg font-semibold text-white">
        {t("director.team.loadError")}
      </h2>

      <p className="mt-2 text-sm text-red-300">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/20 hover:text-cyan-300"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">
      <Users className="mx-auto h-9 w-9 text-slate-700" />

      <h2 className="mt-4 text-lg font-semibold text-white">
        {search ? t("director.team.noResults") : t("director.team.noManagers")}
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        {search ? t("director.team.noResultsHint") : t("director.team.noManagersHint")}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatRole(role: string) {
  return roleLabel(role);
}

function formatStatus(status: string) {
  return statusLabel(status === "terminé" ? "termine" : status);
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