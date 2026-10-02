import { useCallback, useEffect, useState } from "react";
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

type MemberDraft = {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  phone: string;
  weekly_capacity: number;
};
type TeamDraft = { id?: number; name: string; description: string; color: string; member_ids: number[] };

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#60a5fa"];

export default function TeamMembersPage() {
  const [tab, setTab] = useState<"members" | "teams">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft | null>(null);
  const [teamDraft, setTeamDraft] = useState<TeamDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([chefApi.members(), chefApi.teams()]);
      setMembers(m);
      setTeams(t);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Impossible de charger l'équipe."));
    } finally {
      setLoading(false);
    }
  }, []);

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
          setNotice(`Membre créé. Mot de passe temporaire à lui communiquer : ${r.temporary_password}`);
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
    if (!window.confirm(`Retirer ${m.first_name} ${m.last_name} de votre équipe ? Ses tâches seront libérées.`)) return;
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
      setError("Le nom de l'équipe est obligatoire.");
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

  async function removeTeam(t: Team) {
    if (!window.confirm(`Supprimer l'équipe « ${t.name} » ?`)) return;
    try {
      await chefApi.deleteTeam(t.id);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  if (loading) return <div className={`${cardCls} p-8 text-center text-sm text-slate-400`}>Chargement de votre équipe…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipes & membres"
        subtitle="Gérez vos membres, composez des équipes et affectez-les à vos projets."
        action={
          tab === "members" ? (
            <button className={btnPrimary} onClick={() => setMemberDraft({ first_name: "", last_name: "", email: "", job_title: "", phone: "", weekly_capacity: 40 })}>
              + Ajouter un membre
            </button>
          ) : (
            <button className={btnPrimary} onClick={() => setTeamDraft({ name: "", description: "", color: COLORS[0], member_ids: [] })}>
              + Créer une équipe
            </button>
          )
        }
      />

      {error && (
        <div className="flex justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          <span>{error}</span><button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {notice && (
        <div className="flex justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
          <span>{notice}</span><button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(["members", "teams"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium transition ${tab === k ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400 hover:text-white"}`}
          >
            {k === "members" ? `Membres (${members.length})` : `Équipes (${teams.length})`}
          </button>
        ))}
      </div>

      {tab === "members" &&
        (members.length === 0 ? (
          <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>Aucun membre pour le moment. Ajoutez votre premier membre.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className={`${cardCls} p-5 transition hover:border-cyan-400/30`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
                    {m.first_name?.charAt(0)}{m.last_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{m.first_name} {m.last_name}</h3>
                    <p className="truncate text-sm text-slate-400">{m.job_title || m.role}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 border-t border-white/[0.06] pt-3 text-sm text-slate-400">
                  <p className="truncate">✉️ {m.email}</p>
                  {m.phone && <p>📞 {m.phone}</p>}
                  <p className="text-xs text-slate-500">
                    {m.open_tasks_count ?? 0} tâche(s) ouverte(s) · {m.done_tasks_count ?? 0} terminée(s) · {m.weekly_capacity ?? 40} h/sem
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
                      })
                    }
                  >
                    Modifier
                  </button>
                  <button className={`${btnDanger} !py-2`} onClick={() => removeMember(m)}>Retirer</button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "teams" &&
        (teams.length === 0 ? (
          <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>Aucune équipe. Créez-en une pour regrouper vos membres.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((t) => (
              <div key={t.id} className={`${cardCls} p-5`} style={{ borderTopColor: t.color, borderTopWidth: 3 }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{t.name}</h3>
                    {t.description && <p className="mt-1 text-sm text-slate-400">{t.description}</p>}
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{t.projects_count ?? 0} projet(s)</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.members.length === 0 && <span className="text-xs text-slate-500">Aucun membre</span>}
                  {t.members.map((m) => (
                    <span key={m.id} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200">
                      {m.first_name} {m.last_name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    className={`${btnGhost} flex-1 !py-2`}
                    onClick={() =>
                      setTeamDraft({ id: t.id, name: t.name, description: t.description ?? "", color: t.color, member_ids: t.members.map((m) => m.id) })
                    }
                  >
                    Modifier
                  </button>
                  <button className={`${btnDanger} !py-2`} onClick={() => removeTeam(t)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {memberDraft && (
        <Modal title={memberDraft.id ? "Modifier le membre" : "Ajouter un membre"} onClose={() => setMemberDraft(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom"><input className={inputCls} value={memberDraft.first_name} onChange={(e) => setMemberDraft({ ...memberDraft, first_name: e.target.value })} /></Field>
              <Field label="Nom"><input className={inputCls} value={memberDraft.last_name} onChange={(e) => setMemberDraft({ ...memberDraft, last_name: e.target.value })} /></Field>
            </div>
            <Field label="Email"><input type="email" className={inputCls} value={memberDraft.email} onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Poste"><input className={inputCls} value={memberDraft.job_title} onChange={(e) => setMemberDraft({ ...memberDraft, job_title: e.target.value })} /></Field>
              <Field label="Téléphone"><input className={inputCls} value={memberDraft.phone} onChange={(e) => setMemberDraft({ ...memberDraft, phone: e.target.value })} /></Field>
            </div>
            <Field label="Capacité hebdomadaire (heures)">
              <input type="number" min={1} max={80} className={inputCls} value={memberDraft.weekly_capacity} onChange={(e) => setMemberDraft({ ...memberDraft, weekly_capacity: Number(e.target.value) })} />
            </Field>
            {!memberDraft.id && <p className="text-xs text-slate-500">Un mot de passe temporaire sera généré et affiché après la création.</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button className={btnGhost} onClick={() => setMemberDraft(null)}>Annuler</button>
              <button className={btnPrimary} onClick={saveMember} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </Modal>
      )}

      {teamDraft && (
        <Modal title={teamDraft.id ? "Modifier l'équipe" : "Créer une équipe"} onClose={() => setTeamDraft(null)}>
          <div className="space-y-4">
            <Field label="Nom"><input className={inputCls} value={teamDraft.name} onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })} /></Field>
            <Field label="Description"><textarea className={inputCls} rows={2} value={teamDraft.description} onChange={(e) => setTeamDraft({ ...teamDraft, description: e.target.value })} /></Field>
            <Field label="Couleur" group>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => setTeamDraft({ ...teamDraft, color: c })}
                    className={`h-7 w-7 rounded-full border-2 ${teamDraft.color === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </Field>
            <Field label="Membres" group>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/[0.08] p-2">
                {members.length === 0 && <p className="p-2 text-xs text-slate-500">Ajoutez d'abord des membres.</p>}
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
              <button className={btnGhost} onClick={() => setTeamDraft(null)}>Annuler</button>
              <button className={btnPrimary} onClick={saveTeam} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
