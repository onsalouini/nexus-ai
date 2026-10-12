import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, GripVertical, Scale, Sparkles, UserRound } from "lucide-react";
import { formatDate } from "../../i18n/format";
import { exportRows } from "../../utils/export";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../lib/toast";
import Avatar from "../../components/ui-nexus/Avatar";
import { SkeletonCards } from "../../components/ui-nexus/Skeleton";
import {
  chefApi,
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
  errMsg,
  inputCls,
} from "../../components/ui-nexus/kit";

// Chaque colonne a sa couleur (pastille, liseré, zone de dépôt)
const COLUMNS: { key: TaskStatus; dot: string; accent: string; drop: string }[] = [
  { key: "todo", dot: "bg-slate-400", accent: "from-slate-400/70", drop: "border-slate-400/40 bg-slate-400/[0.04]" },
  { key: "in_progress", dot: "bg-sky-400", accent: "from-sky-400/80", drop: "border-sky-400/40 bg-sky-400/[0.05]" },
  { key: "review", dot: "bg-amber-400", accent: "from-amber-400/80", drop: "border-amber-400/40 bg-amber-400/[0.05]" },
  { key: "done", dot: "bg-emerald-400", accent: "from-emerald-400/80", drop: "border-emerald-400/40 bg-emerald-400/[0.05]" },
];

const PRIORITY: Record<TaskPriority, { cls: string; bar: string }> = {
  low: { cls: "text-slate-300 bg-white/[0.05] border-white/10", bar: "bg-slate-400" },
  medium: { cls: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20", bar: "bg-cyan-400" },
  high: { cls: "text-amber-300 bg-amber-400/10 border-amber-400/25", bar: "bg-amber-400" },
  critical: { cls: "text-rose-300 bg-rose-500/10 border-rose-500/25", bar: "bg-rose-500" },
};

type Person = { id: number; first_name: string; last_name: string; avatar_path?: string | null; job_title?: string | null };

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [members, setMembers] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState<number | "" | "none">("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // Numéro de la dernière requête : une réponse plus ancienne (serveur lent) ne doit pas
  // écraser un état plus récent, par ex. une assignation faite entre-temps
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    try {
      const [p, m, taskList] = await Promise.all([
        chefApi.projects(),
        chefApi.members(),
        chefApi.tasks(projectId ? { project_id: projectId } : undefined),
      ]);
      if (current !== requestId.current) return;
      setProjects(p);
      setMembers(m);
      setTasks(taskList);
      if (projectId === "" && p.length > 0) setProjectId(p[0].id);
    } catch (e) {
      toast.error(errMsg(e, t("chef.tasks.loadError")));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /*
  | Personnes assignables : l'équipe du chef + le chef lui-même ("Moi")
  | + toute personne déjà assignée qui n'en ferait pas partie (sinon le select
  | affichait "Non assignée" pour une tâche pourtant assignée).
  */
  const assignees = useMemo(() => {
    const map = new Map<number, Person>();
    if (user) map.set(user.id, { id: user.id, first_name: user.first_name, last_name: user.last_name, avatar_path: user.avatar_path });
    members.forEach((m) => map.set(m.id, m));
    tasks.forEach((task) => {
      if (task.assignee && !map.has(task.assignee.id)) map.set(task.assignee.id, task.assignee as Person);
    });
    return [...map.values()];
  }, [members, tasks, user]);

  const personLabel = (person: Person) =>
    person.id === user?.id ? `${t("chef.tasks.me")} (${person.first_name} ${person.last_name})` : `${person.first_name} ${person.last_name}`;

  const visible = useMemo(
    () =>
      tasks.filter((task) =>
        assigneeFilter === "" ? true : assigneeFilter === "none" ? !task.assigned_to : task.assigned_to === assigneeFilter
      ),
    [tasks, assigneeFilter]
  );

  const today = new Date().toISOString().slice(0, 10);
  const unassignedCount = tasks.filter((task) => !task.assigned_to && task.status !== "done").length;

  async function move(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    requestId.current++;
    // Mise à jour optimiste de LA tâche déplacée uniquement
    setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status } : x)));
    try {
      await chefApi.updateTask(task.id, { status });
      await load();
    } catch (e) {
      toast.error(errMsg(e));
      void load();
    }
  }

  async function assign(task: Task, value: string) {
    requestId.current++; // invalide un chargement en cours
    const userId = value === "" ? null : Number(value);
    const person = assignees.find((p) => p.id === userId);
    setTasks((prev) =>
      prev.map((x) => (x.id === task.id ? { ...x, assigned_to: userId, assignee: person ?? null } : x))
    );
    try {
      await chefApi.updateTask(task.id, { assigned_to: userId });
      toast.success(
        person ? t("chef.tasks.assignedTo", { title: task.title, name: `${person.first_name} ${person.last_name}` }) : t("chef.tasks.unassignedToast", { title: task.title })
      );
      await load();
    } catch (e) {
      toast.error(errMsg(e));
      void load();
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim() || draft.project_id === "") {
      toast.error(t("chef.tasks.required"));
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
      toast.success(t("chef.tasks.saved"));
      setDraft(null);
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(task: Task) {
    if (!window.confirm(t("chef.tasks.confirmDelete", { title: task.title }))) return;
    try {
      await chefApi.deleteTask(task.id);
      setDraft(null);
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function autoAssign() {
    if (projectId === "") return;
    setBusy(true);
    try {
      const r = await chefApi.autoAssign(projectId);
      const assigned = (r.assigned ?? []) as { user_id: number }[];
      if (assigned.length === 0) {
        toast.info(t("chef.tasks.nothingToAssign"));
      } else {
        // Résumé : "Amine : 2 · Aymen : 1"
        const counts = assigned.reduce<Record<number, number>>((acc, a) => ({ ...acc, [a.user_id]: (acc[a.user_id] ?? 0) + 1 }), {});
        const summary = Object.entries(counts)
          .map(([id, count]) => `${assignees.find((p) => p.id === Number(id))?.first_name ?? "#" + id} : ${count}`)
          .join(" · ");
        toast.success(t("chef.tasks.autoAssigned", { count: assigned.length, summary }));
      }
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (projectId === "") return;
    setBusy(true);
    toast.info(t("chef.tasks.generating"));
    try {
      const r = await chefApi.generateTasks(projectId, 6);
      toast.success(
        t("chef.tasks.generated", {
          count: r.tasks.length,
          source: r.source === "groq" ? t("chef.tasks.sourceGroq") : t("chef.tasks.sourceStandard"),
        })
      );
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  // Export des tâches affichées (filtre membre appliqué)
  function exportTasks(format: "csv" | "xlsx") {
    const projectName = projects.find((p) => p.id === projectId)?.name ?? "";
    void exportRows(format, `${t("chef.sidebar.tasks")}-${projectName}`, [
      { header: t("chef.tasks.titleLabel"), value: (task: Task) => task.title },
      { header: t("chef.tasks.project"), value: (task: Task) => task.project?.name ?? projectName },
      { header: t("chef.editProject.status"), value: (task: Task) => t(`chef.tasks.status.${task.status}`) },
      { header: t("chef.tasks.priorityLabel"), value: (task: Task) => t(`chef.tasks.priority.${task.priority}`) },
      { header: t("chef.tasks.assignee"), value: (task: Task) => (task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : t("chef.tasks.unassigned")) },
      { header: t("chef.editProject.deadline"), value: (task: Task) => task.due_date ?? "" },
      { header: t("chef.tasks.estimated"), value: (task: Task) => task.estimated_hours },
      { header: t("chef.tasks.spent"), value: (task: Task) => task.spent_hours },
    ], visible);
  }

  if (loading) return <SkeletonCards count={4} className="h-48" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("chef.sidebar.tasks")}
        subtitle={t("chef.tasks.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <button className={`${btnGhost} border-violet-400/25 text-violet-200 hover:bg-violet-500/10`} onClick={generate} disabled={busy || projectId === ""}>
              <Sparkles className="h-4 w-4" /> {t("chef.tasks.generate")}
            </button>
            <button
              className={`${btnGhost} border-emerald-400/25 text-emerald-200 hover:bg-emerald-500/10`}
              onClick={autoAssign}
              disabled={busy || projectId === "" || unassignedCount === 0}
              title={unassignedCount === 0 ? t("chef.tasks.nothingToAssign") : undefined}
            >
              <Scale className="h-4 w-4" /> {t("chef.tasks.autoAssign")}
              {unassignedCount > 0 && (
                <span className="rounded-full bg-emerald-400/20 px-1.5 text-[11px] text-emerald-200">{unassignedCount}</span>
              )}
            </button>
            <button className={btnGhost} onClick={() => exportTasks("csv")} disabled={!visible.length}>CSV</button>
            <button className={btnGhost} onClick={() => exportTasks("xlsx")} disabled={!visible.length}>Excel</button>
            <button className={btnPrimary} onClick={() => setDraft(emptyDraft(projectId))} disabled={projects.length === 0}>
              + {t("chef.tasks.new")}
            </button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t("chef.tasks.project")}>
          <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}>
            {projects.length === 0 && <option value="">{t("chef.teamModal.noProject")}</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label={t("chef.tasks.filterMember")}>
          <select
            className={inputCls}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value === "" || e.target.value === "none" ? (e.target.value as "" | "none") : Number(e.target.value))}
          >
            <option value="">{t("chef.tasks.allMembers")}</option>
            <option value="none">{t("chef.tasks.unassigned")}</option>
            {assignees.map((m) => (
              <option key={m.id} value={m.id}>{personLabel(m)}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Charge par personne : qui a combien de tâches ouvertes */}
      {assignees.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {assignees.map((person) => {
            const open = tasks.filter((x) => x.assigned_to === person.id && x.status !== "done").length;
            const active = assigneeFilter === person.id;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setAssigneeFilter(active ? "" : person.id)}
                className={`flex items-center gap-2 rounded-full border py-1 pe-3 ps-1 text-xs transition ${
                  active ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20"
                }`}
              >
                <Avatar person={person} size="xs" />
                {person.id === user?.id ? t("chef.tasks.me") : person.first_name}
                <span className="rounded-full bg-white/[0.08] px-1.5 text-[10px]">{open}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visible.filter((task) => task.status === col.key);
          const isOver = overColumn === col.key && dragId !== null;
          return (
            <div
              key={col.key}
              className={`relative min-h-[300px] overflow-hidden rounded-2xl border p-3 backdrop-blur-xl transition ${
                isOver ? col.drop : "border-white/[0.08] bg-[#071021]/70"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setOverColumn(col.key);
              }}
              onDragLeave={() => setOverColumn(null)}
              onDrop={() => {
                const task = tasks.find((x) => x.id === dragId);
                if (task) void move(task, col.key);
                setDragId(null);
                setOverColumn(null);
              }}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${col.accent} to-transparent`} />
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  {t(`chef.tasks.status.${col.key}`)}
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map((task) => {
                  const late = task.status !== "done" && !!task.due_date && task.due_date < today;
                  const ratio = task.estimated_hours > 0 ? Math.min(100, (task.spent_hours / task.estimated_hours) * 100) : 0;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverColumn(null);
                      }}
                      className={`group relative cursor-grab overflow-hidden rounded-xl border bg-gradient-to-br from-[#0d1a2f] to-[#0a1324] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-cyan-400/30 active:cursor-grabbing ${
                        late ? "border-rose-500/30" : "border-white/[0.08]"
                      } ${dragId === task.id ? "opacity-40" : ""}`}
                    >
                      <span className={`absolute inset-y-0 start-0 w-0.5 ${PRIORITY[task.priority].bar}`} />
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className="text-start text-sm font-medium leading-5 text-white hover:text-cyan-300"
                          onClick={() =>
                            setDraft({
                              id: task.id,
                              project_id: task.project_id,
                              title: task.title,
                              description: task.description ?? "",
                              status: task.status,
                              priority: task.priority,
                              estimated_hours: task.estimated_hours,
                              spent_hours: task.spent_hours,
                              due_date: task.due_date ?? "",
                              assigned_to: task.assigned_to ?? "",
                            })
                          }
                        >
                          {task.title}
                        </button>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${PRIORITY[task.priority].cls}`}>
                          {t(`chef.tasks.priority.${task.priority}`)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {task.spent_hours}/{task.estimated_hours} {t("common.hoursShort")}
                        </span>
                        {task.due_date && (
                          <span className={`flex items-center gap-1 ${late ? "font-semibold text-rose-300" : ""}`}>
                            <CalendarClock className="h-3 w-3" />
                            {formatDate(task.due_date, { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={`h-full rounded-full ${ratio >= 100 ? "bg-emerald-400" : "bg-cyan-400/70"}`} style={{ width: `${ratio}%` }} />
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {task.assignee ? (
                          <Avatar person={task.assignee as Person} size="sm" />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 text-slate-500">
                            <UserRound className="h-4 w-4" />
                          </span>
                        )}
                        <select
                          aria-label={t("chef.tasks.assignee")}
                          className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#071021] px-2 py-1.5 text-xs text-slate-200 outline-none transition focus:border-cyan-400/40"
                          value={task.assigned_to ?? ""}
                          onChange={(e) => void assign(task, e.target.value)}
                        >
                          <option value="">{t("chef.tasks.unassigned")}</option>
                          {assignees.map((m) => (
                            <option key={m.id} value={m.id}>{personLabel(m)}</option>
                          ))}
                        </select>
                        <GripVertical className="h-4 w-4 shrink-0 text-slate-600 opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/[0.06] px-1 py-8 text-center text-xs text-slate-600">
                    {t("chef.tasks.dropHere")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {draft && (
        <Modal title={draft.id ? t("chef.tasks.edit") : t("chef.tasks.new")} onClose={() => setDraft(null)}>
          <div className="space-y-4">
            <Field label={t("chef.tasks.titleLabel")}>
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={t("chef.projectForm.description")}>
              <textarea className={inputCls} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("chef.tasks.project")}>
                <select className={inputCls} value={draft.project_id} onChange={(e) => setDraft({ ...draft, project_id: Number(e.target.value) })}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label={t("chef.tasks.assignee")}>
                <select className={inputCls} value={draft.assigned_to} onChange={(e) => setDraft({ ...draft, assigned_to: e.target.value ? Number(e.target.value) : "" })}>
                  <option value="">{t("chef.tasks.unassigned")}</option>
                  {assignees.map((m) => <option key={m.id} value={m.id}>{personLabel(m)}</option>)}
                </select>
              </Field>
              <Field label={t("chef.editProject.status")}>
                <select className={inputCls} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{t(`chef.tasks.status.${c.key}`)}</option>)}
                </select>
              </Field>
              <Field label={t("chef.tasks.priorityLabel")}>
                <select className={inputCls} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}>
                  {Object.keys(PRIORITY).map((k) => <option key={k} value={k}>{t(`chef.tasks.priority.${k}`)}</option>)}
                </select>
              </Field>
              <Field label={t("chef.tasks.estimated")}>
                <input type="number" min={0} className={inputCls} value={draft.estimated_hours} onChange={(e) => setDraft({ ...draft, estimated_hours: e.target.value === "" ? "" : Number(e.target.value) })} />
              </Field>
              <Field label={t("chef.tasks.spent")}>
                <input type="number" min={0} className={inputCls} value={draft.spent_hours} onChange={(e) => setDraft({ ...draft, spent_hours: e.target.value === "" ? "" : Number(e.target.value) })} />
              </Field>
              <Field label={t("chef.editProject.deadline")}>
                <input type="date" className={inputCls} value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              {draft.id ? (
                <button className={btnDanger} onClick={() => remove(tasks.find((task) => task.id === draft.id)!)}>{t("common.delete")}</button>
              ) : <span />}
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => setDraft(null)}>{t("common.cancel")}</button>
                <button className={btnPrimary} onClick={save} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
