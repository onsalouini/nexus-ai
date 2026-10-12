import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { chefApi, type Member, type Team } from "../../services/chefApi";
import {
  Field,
  Modal,
  PageHeader,
  btnDanger,
  btnGhost,
  btnPrimary,
  cardCls,
  errMsg,
  inputCls,
} from "../../components/ui-nexus/kit";
import { exportRows } from "../../utils/export";
import Avatar from "../../components/ui-nexus/Avatar";
import { roleLabel } from "../../i18n/labels";
import { toast } from "../../lib/toast";
import { SkeletonCards } from "../../components/ui-nexus/Skeleton";

type MemberDraft = {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  phone: string;
  weekly_capacity: number;
  role: "membre_equipe" | "agent_support";
};
type TeamDraft = { id?: number; name: string; description: string; color: string; member_ids: number[] };

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#60a5fa"];

export default function TeamMembersPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"members" | "teams">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [teamDraft, setTeamDraft] = useState<TeamDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, teamList] = await Promise.all([chefApi.members(), chefApi.teams()]);
      setMembers(m);
      setTeams(teamList);
      setError(null);
    } catch (e) {
      setError(errMsg(e, t("chef.members.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveMember() {
    if (!memberDraft) return;
    setBusy(true);
    try {
      const { id, ...payload } = memberDraft;
      if (id) {
        await chefApi.updateMember(id, payload);
      } else {
        const r = await chefApi.createMember(payload);
        if (r.temporary_password) {
          setNotice(t("chef.members.createdWithPassword", { password: r.temporary_password }));
          setCredentials({ email: payload.email, password: r.temporary_password });
        }
      }
      setMemberDraft(null);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(m: Member) {
    if (!window.confirm(t("chef.members.confirmRemove", { name: `${m.first_name} ${m.last_name}` }))) return;
    try {
      await chefApi.deleteMember(m.id);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function saveTeam() {
    if (!teamDraft) return;
    if (!teamDraft.name.trim()) {
      setError(t("chef.members.teamNameRequired"));
      return;
    }
    setBusy(true);
    try {
      const { id, ...payload } = teamDraft;
      if (id) await chefApi.updateTeam(id, payload);
      else await chefApi.createTeam(payload);
      setTeamDraft(null);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeTeam(team: Team) {
    if (!window.confirm(t("chef.members.confirmDeleteTeam", { name: team.name }))) return;
    try {
      await chefApi.deleteTeam(team.id);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  function exportTeam(format: "csv" | "xlsx") {
    if (tab === "members") {
      void exportRows(format, t("chef.members.membersLabel"), [
        { header: t("auth.signup.step1.firstName"), value: (m: Member) => m.first_name },
        { header: t("chef.editProject.name"), value: (m: Member) => m.last_name },
        { header: t("auth.email"), value: (m: Member) => m.email },
        { header: t("chef.members.job"), value: (m: Member) => m.job_title ?? "" },
        { header: t("onboarding.phone"), value: (m: Member) => m.phone ?? "" },
        { header: t("chef.members.capacity"), value: (m: Member) => m.weekly_capacity ?? 40 },
        { header: t("employee.tasks.open"), value: (m: Member) => m.open_tasks_count ?? 0 },
        { header: t("employee.tasks.done"), value: (m: Member) => m.done_tasks_count ?? 0 },
      ], members);
    } else {
      void exportRows(format, t("chef.members.teams"), [
        { header: t("chef.editProject.name"), value: (team: Team) => team.name },
        { header: t("chef.projectForm.description"), value: (team: Team) => team.description ?? "" },
        { header: t("chef.members.membersLabel"), value: (team: Team) => team.members.map((m) => `${m.first_name} ${m.last_name}`).join(", ") },
        { header: t("director.sidebar.projects"), value: (team: Team) => team.projects_count ?? 0 },
      ], teams);
    }
  }

  if (loading) return <SkeletonCards count={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("chef.members.title")}
        subtitle={t("chef.members.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
          <button className={btnGhost} onClick={() => exportTeam("csv")} disabled={tab === "members" ? !members.length : !teams.length}>CSV</button>
          <button className={btnGhost} onClick={() => exportTeam("xlsx")} disabled={tab === "members" ? !members.length : !teams.length}>Excel</button>
          {tab === "members" ? (
            <button className={btnPrimary} onClick={() => setMemberDraft({ first_name: "", last_name: "", email: "", job_title: "", phone: "", weekly_capacity: 40, role: "membre_equipe" })}>
              + {t("chef.teamModal.addMember")}
            </button>
          ) : (
            <button className={btnPrimary} onClick={() => setTeamDraft({ name: "", description: "", color: COLORS[0], member_ids: [] })}>
              + {t("chef.members.createTeam")}
            </button>
          )}
          </div>
        }
      />

      {error && (
        <div className="flex justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          <span>{error}</span><button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {notice && !credentials && (
        <div className="flex justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
          <span>{notice}</span><button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}
      {credentials && (
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-200">{t("chef.members.credentialsTitle")}</p>
              <p className="mt-1 text-xs text-slate-400">{t("chef.members.credentialsHint")}</p>
            </div>
            <button onClick={() => { setCredentials(null); setNotice(null); }} aria-label={t("common.close")} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center" dir="ltr">
            <code className="rounded-lg bg-black/30 px-3 py-2 text-cyan-200">{window.location.origin}/signin</code>
            <code className="rounded-lg bg-black/30 px-3 py-2 text-white">{credentials.email} · {credentials.password}</code>
            <button
              className={btnGhost}
              onClick={() => {
                void navigator.clipboard?.writeText(
                  `${window.location.origin}/signin\n${credentials.email}\n${credentials.password}`
                );
                toast.success(t("chef.members.copied"));
              }}
            >
              {t("chef.members.copy")}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(["members", "teams"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium transition ${tab === k ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400 hover:text-white"}`}
          >
            {k === "members" ? t("chef.members.membersTab", { count: members.length }) : t("chef.members.teamsTab", { count: teams.length })}
          </button>
        ))}
      </div>

      {tab === "members" &&
        (members.length === 0 ? (
          <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("chef.members.emptyMembers")}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className={`${cardCls} p-5 transition hover:border-cyan-400/30`}>
                <div className="flex items-center gap-4">
                  <Avatar person={m} size="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{m.first_name} {m.last_name}</h3>
                    <p className="truncate text-sm text-slate-400">{m.job_title ? `${m.job_title} · ${roleLabel(m.role)}` : roleLabel(m.role)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 border-t border-white/[0.06] pt-3 text-sm text-slate-400">
                  <p className="truncate">✉️ {m.email}</p>
                  {m.phone && <p>📞 {m.phone}</p>}
                  <p className="text-xs text-slate-500">
                    {t("chef.members.workload", { open: m.open_tasks_count ?? 0, done: m.done_tasks_count ?? 0, capacity: m.weekly_capacity ?? 40 })}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    className={`${btnGhost} flex-1 !py-2`}
                    onClick={() =>
                      setMemberDraft({
                        id: m.id,
                        first_name: m.first_name,
                        last_name: m.last_name,
                        email: m.email,
                        job_title: m.job_title ?? "",
                        phone: m.phone ?? "",
                        weekly_capacity: m.weekly_capacity ?? 40,
                        role: m.role === "agent_support" ? "agent_support" : "membre_equipe",
                      })
                    }
                  >
                    {t("common.edit")}
                  </button>
                  <button className={`${btnDanger} !py-2`} onClick={() => removeMember(m)}>{t("chef.members.remove")}</button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "teams" &&
        (teams.length === 0 ? (
          <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("chef.members.emptyTeams")}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <div key={team.id} className={`${cardCls} p-5`} style={{ borderTopColor: team.color, borderTopWidth: 3 }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    {team.description && <p className="mt-1 text-sm text-slate-400">{team.description}</p>}
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{t("chef.members.projectCount", { count: team.projects_count ?? 0 })}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.members.length === 0 && <span className="text-xs text-slate-500">{t("chef.members.noMembers")}</span>}
                  {team.members.map((m) => (
                    <span key={m.id} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200">
                      {m.first_name} {m.last_name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    className={`${btnGhost} flex-1 !py-2`}
                    onClick={() =>
                      setTeamDraft({ id: team.id, name: team.name, description: team.description ?? "", color: team.color, member_ids: team.members.map((m) => m.id) })
                    }
                  >
                    {t("common.edit")}
                  </button>
                  <button className={`${btnDanger} !py-2`} onClick={() => removeTeam(team)}>{t("common.delete")}</button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {memberDraft && (
        <Modal title={memberDraft.id ? t("chef.members.editMember") : t("chef.teamModal.addMember")} onClose={() => setMemberDraft(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("auth.signup.step1.firstName")}><input className={inputCls} value={memberDraft.first_name} onChange={(e) => setMemberDraft({ ...memberDraft, first_name: e.target.value })} /></Field>
              <Field label={t("chef.editProject.name")}><input className={inputCls} value={memberDraft.last_name} onChange={(e) => setMemberDraft({ ...memberDraft, last_name: e.target.value })} /></Field>
            </div>
            <Field label={t("auth.email")}><input type="email" className={inputCls} value={memberDraft.email} onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("chef.members.job")}><input className={inputCls} value={memberDraft.job_title} onChange={(e) => setMemberDraft({ ...memberDraft, job_title: e.target.value })} /></Field>
              <Field label={t("onboarding.phone")}><input className={inputCls} value={memberDraft.phone} onChange={(e) => setMemberDraft({ ...memberDraft, phone: e.target.value })} /></Field>
            </div>
            {!memberDraft.id && (
              <Field label={t("director.team.role")}>
                <select
                  className={inputCls}
                  value={memberDraft.role}
                  onChange={(e) => setMemberDraft({ ...memberDraft, role: e.target.value as MemberDraft["role"] })}
                >
                  <option value="membre_equipe">{t("common.roles.membre_equipe")}</option>
                  <option value="agent_support">{t("common.roles.agent_support")}</option>
                </select>
              </Field>
            )}
            <Field label={t("chef.members.capacity")}>
              <input type="number" min={1} max={80} className={inputCls} value={memberDraft.weekly_capacity} onChange={(e) => setMemberDraft({ ...memberDraft, weekly_capacity: Number(e.target.value) })} />
            </Field>
            {!memberDraft.id && <p className="text-xs text-slate-500">{t("chef.members.tempPasswordNote")}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button className={btnGhost} onClick={() => setMemberDraft(null)}>{t("common.cancel")}</button>
              <button className={btnPrimary} onClick={saveMember} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</button>
            </div>
          </div>
        </Modal>
      )}

      {teamDraft && (
        <Modal title={teamDraft.id ? t("chef.members.editTeam") : t("chef.members.createTeam")} onClose={() => setTeamDraft(null)}>
          <div className="space-y-4">
            <Field label={t("chef.editProject.name")}><input className={inputCls} value={teamDraft.name} onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })} /></Field>
            <Field label={t("chef.projectForm.description")}><textarea className={inputCls} rows={2} value={teamDraft.description} onChange={(e) => setTeamDraft({ ...teamDraft, description: e.target.value })} /></Field>
            <Field label={t("chef.members.color")} group>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => setTeamDraft({ ...teamDraft, color: c })}
                    className={`h-7 w-7 rounded-full border-2 ${teamDraft.color === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </Field>
            <Field label={t("chef.members.membersLabel")} group>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/[0.08] p-2">
                {members.length === 0 && <p className="p-2 text-xs text-slate-500">{t("chef.members.addMembersFirst")}</p>}
                {members.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-200 hover:bg-white/[0.04]">
                    <input type="checkbox" checked={teamDraft.member_ids.includes(m.id)}
                      onChange={(e) => setTeamDraft({ ...teamDraft, member_ids: e.target.checked ? [...teamDraft.member_ids, m.id] : teamDraft.member_ids.filter((x) => x !== m.id) })} />
                    {m.first_name} {m.last_name} <span className="text-xs text-slate-500">{m.job_title}</span>
                  </label>
                ))}
              </div>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button className={btnGhost} onClick={() => setTeamDraft(null)}>{t("common.cancel")}</button>
              <button className={btnPrimary} onClick={saveTeam} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
