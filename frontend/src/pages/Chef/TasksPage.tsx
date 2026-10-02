import { useCallback, useEffect, useMemo, useState } from "react";
import {
  chefApi,
  type Member,
  type ProjectLite,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../../services/chefApi";
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

const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: "todo", label: "À faire", dot: "bg-slate-400" },
  { key: "in_progress", label: "En cours", dot: "bg-blue-400" },
  { key: "review", label: "En revue", dot: "bg-amber-400" },
  { key: "done", label: "Terminé", dot: "bg-emerald-400" },
];

const PRIORITY: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: "Faible", cls: "text-slate-300 bg-white/[0.05] border-white/10" },
  medium: { label: "Moyenne", cls: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" },
  high: { label: "Haute", cls: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
  critical: { label: "Critique", cls: "text-red-300 bg-red-500/10 border-red-500/20" },
};

type Draft = {
  id?: number;
  project_id: number | "";
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours: number | "";
  spent_hours: number | "";
  due_date: string;
  assigned_to: number | "";
};

const emptyDraft = (projectId: number | ""): Draft => ({
  project_id: projectId,
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  estimated_hours: 8,
  spent_hours: 0,
  due_date: "",
  assigned_to: "",
});

export default function TasksPage() {
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [p, m, t] = await Promise.all([
        chefApi.projects(),
        chefApi.members(),
        chefApi.tasks(projectId ? { project_id: projectId } : undefined),
      ]);
      setProjects(p);
      setMembers(m);
      setTasks(t);
      if (projectId === "" && p.length > 0) setProjectId(p[0].id);
    } catch (e) {
      setError(errMsg(e, "Impossible de charger les tâches."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => tasks.filter((t) => (assigneeFilter === "" ? true : t.assigned_to === assigneeFilter)),
    [tasks, assigneeFilter]
  );

  const today = new Date().toISOString().slice(0, 10);

  async function move(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await chefApi.updateTask(task.id, { status });
      await load();
    } catch (e) {
      setError(errMsg(e));
      load();
    }
  }

  async function assign(task: Task, userId: string) {
    try {
      await chefApi.updateTask(task.id, { assigned_to: userId === "" ? null : Number(userId) });
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim() || draft.project_id === "") {
      setError("Le titre et le projet sont obligatoires.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        project_id: draft.project_id,
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        priority: draft.priority,
        estimated_hours: draft.estimated_hours === "" ? 0 : draft.estimated_hours,
        spent_hours: draft.spent_hours === "" ? 0 : draft.spent_hours,
        due_date: draft.due_date || null,
        assigned_to: draft.assigned_to === "" ? null : draft.assigned_to,
      };
      if (draft.id) await chefApi.updateTask(draft.id, payload);
      else await chefApi.createTask(payload);
      setDraft(null);
      setError(null);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(task: Task) {
    if (!window.confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    try {
      await chefApi.deleteTask(task.id);
      setDraft(null);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function autoAssign() {
    if (projectId === "") return;
    setBusy(true);
    try {
      const r = await chefApi.autoAssign(projectId);
      setNotice(r.message);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (projectId === "") return;
    setBusy(true);
    setNotice("Génération des tâches par l'IA…");
    try {
      const r = await chefApi.generateTasks(projectId, 6);
      setNotice(
        `${r.tasks.length} tâches générées (${r.source === "groq" ? "IA Groq" : "modèle de découpage standard"}).`
      );
      await load();
    } catch (e) {
      setNotice(null);
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className={`${cardCls} p-8 text-center text-sm text-slate-400`}>Chargement des tâches…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tâches"
        subtitle="Répartissez le travail entre les membres de l'équipe et suivez l'avancement."
        action={
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={generate} disabled={busy || projectId === ""}>
              ✨ Générer par IA
            </button>
            <button className={btnGhost} onClick={autoAssign} disabled={busy || projectId === ""}>
              ⚖️ Répartir automatiquement
            </button>
            <button className={btnPrimary} onClick={() => setDraft(emptyDraft(projectId))} disabled={projects.length === 0}>
              + Nouvelle tâche
            </button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Projet">
          <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}>
            {projects.length === 0 && <option value="">Aucun projet</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Filtrer par membre">
          <select className={inputCls} value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Tous les membres</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`${cardCls} min-h-[260px] p-3`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const t = tasks.find((x) => x.id === dragId);
                if (t) move(t, col.key);
                setDragId(null);
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  {col.label}
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map((t) => {
                  const late = t.status !== "done" && t.due_date && t.due_date < today;
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      className="cursor-grab rounded-xl border border-white/[0.08] bg-[#0B1628] p-3 transition hover:border-cyan-400/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className="text-left text-sm font-medium text-white hover:text-cyan-300"
                          onClick={() =>
                            setDraft({
                              id: t.id,
                              project_id: t.project_id,
                              title: t.title,
                              description: t.description ?? "",
                              status: t.status,
                              priority: t.priority,
                              estimated_hours: t.estimated_hours,
                              spent_hours: t.spent_hours,
                              due_date: t.due_date ?? "",
                              assigned_to: t.assigned_to ?? "",
                            })
                          }
                        >
                          {t.title}
                        </button>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${PRIORITY[t.priority].cls}`}>
                          {PRIORITY[t.priority].label}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{t.spent_hours}/{t.estimated_hours} h</span>
                        {t.due_date && (
                          <span className={late ? "font-semibold text-red-400" : ""}>
                            {late ? "⚠ " : ""}{t.due_date}
                          </span>
                        )}
                      </div>

                      <select
                        className="mt-3 w-full rounded-lg border border-white/[0.08] bg-[#071021] px-2 py-1.5 text-xs text-slate-200 outline-none"
                        value={t.assigned_to ?? ""}
                        onChange={(e) => assign(t, e.target.value)}
                      >
                        <option value="">Non assignée</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-slate-600">Déposez une tâche ici</p>}
              </div>
            </div>
          );
        })}
      </div>

      {draft && (
        <Modal title={draft.id ? "Modifier la tâche" : "Nouvelle tâche"} onClose={() => setDraft(null)}>
          <div className="space-y-4">
            <Field label="Titre">
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={inputCls} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Projet">
                <select className={inputCls} value={draft.project_id} onChange={(e) => setDraft({ ...draft, project_id: Number(e.target.value) })}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Assignée à">
                <select className={inputCls} value={draft.assigned_to} onChange={(e) => setDraft({ ...draft, assigned_to: e.target.value ? Number(e.target.value) : "" })}>
                  <option value="">Non assignée</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select className={inputCls} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Priorité">
                <select className={inputCls} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}>
                  {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
              <Field label="Heures estimées">
                <input type="number" min={0} className={inputCls} value={draft.estimated_hours} onChange={(e) => setDraft({ ...draft, estimated_hours: e.target.value === "" ? "" : Number(e.target.value) })} />
              </Field>
              <Field label="Heures passées">
                <input type="number" min={0} className={inputCls} value={draft.spent_hours} onChange={(e) => setDraft({ ...draft, spent_hours: e.target.value === "" ? "" : Number(e.target.value) })} />
              </Field>
              <Field label="Échéance">
                <input type="date" className={inputCls} value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              {draft.id ? (
                <button className={btnDanger} onClick={() => remove(tasks.find((t) => t.id === draft.id)!)}>Supprimer</button>
              ) : <span />}
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => setDraft(null)}>Annuler</button>
                <button className={btnPrimary} onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
