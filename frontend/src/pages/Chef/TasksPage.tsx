import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../i18n/format";
import { exportRows } from "../../utils/export";
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

// Libellés : chef.tasks.status.<key> / chef.tasks.priority.<key>
const COLUMNS: { key: TaskStatus; dot: string }[] = [
  { key: "todo", dot: "bg-slate-400" },
  { key: "in_progress", dot: "bg-blue-400" },
  { key: "review", dot: "bg-amber-400" },
  { key: "done", dot: "bg-emerald-400" },
];

const PRIORITY: Record<TaskPriority, { cls: string }> = {
  low: { cls: "text-slate-300 bg-white/[0.05] border-white/10" },
  medium: { cls: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" },
  high: { cls: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
  critical: { cls: "text-red-300 bg-red-500/10 border-red-500/20" },
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
  const { t } = useTranslation();
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
      const [p, m, taskList] = await Promise.all([
        chefApi.projects(),
        chefApi.members(),
        chefApi.tasks(projectId ? { project_id: projectId } : undefined),
      ]);
      setProjects(p);
      setMembers(m);
      setTasks(taskList);
      if (projectId === "" && p.length > 0) setProjectId(p[0].id);
    } catch (e) {
      setError(errMsg(e, t("chef.tasks.loadError")));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => tasks.filter((task) => (assigneeFilter === "" ? true : task.assigned_to === assigneeFilter)),
    [tasks, assigneeFilter]
  );

  const today = new Date().toISOString().slice(0, 10);

  async function move(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setTasks((prev) => prev.map((task) => (task.id === task.id ? { ...task, status } : task)));
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
      setError(t("chef.tasks.required"));
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
    if (!window.confirm(t("chef.tasks.confirmDelete", { title: task.title }))) return;
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
    setNotice(t("chef.tasks.generating"));
    try {
      const r = await chefApi.generateTasks(projectId, 6);
      setNotice(
        t("chef.tasks.generated", {
          count: r.tasks.length,
          source: r.source === "groq" ? t("chef.tasks.sourceGroq") : t("chef.tasks.sourceStandard"),
        })
      );
      await load();
    } catch (e) {
      setNotice(null);
      setError(errMsg(e));
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

  if (loading) {
    return <div className={`${cardCls} p-8 text-center text-sm text-slate-400`}>{t("chef.tasks.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("chef.sidebar.tasks")}
        subtitle={t("chef.tasks.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={generate} disabled={busy || projectId === ""}>
              ✨ {t("chef.tasks.generate")}
            </button>
            <button className={btnGhost} onClick={autoAssign} disabled={busy || projectId === ""}>
              ⚖️ {t("chef.tasks.autoAssign")}
            </button>
            <button className={btnGhost} onClick={() => exportTasks("csv")} disabled={!visible.length}>CSV</button>
            <button className={btnGhost} onClick={() => exportTasks("xlsx")} disabled={!visible.length}>Excel</button>
            <button className={btnPrimary} onClick={() => setDraft(emptyDraft(projectId))} disabled={projects.length === 0}>
              + {t("chef.tasks.new")}
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
        <Field label={t("chef.tasks.project")}>
          <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}>
            {projects.length === 0 && <option value="">{t("chef.teamModal.noProject")}</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label={t("chef.tasks.filterMember")}>
          <select className={inputCls} value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value ? Number(e.target.value) : "")}>
            <option value="">{t("chef.tasks.allMembers")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visible.filter((task) => task.status === col.key);
          return (
            <div
              key={col.key}
              className={`${cardCls} min-h-[260px] p-3`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const task = tasks.find((x) => x.id === dragId);
                if (task) move(task, col.key);
                setDragId(null);
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  {t(`chef.tasks.status.${col.key}`)}
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map((task) => {
                  const late = task.status !== "done" && task.due_date && task.due_date < today;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      className="cursor-grab rounded-xl border border-white/[0.08] bg-[#0B1628] p-3 transition hover:border-cyan-400/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className="text-start text-sm font-medium text-white hover:text-cyan-300"
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
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${PRIORITY[task.priority].cls}`}>
                          {t(`chef.tasks.priority.${task.priority}`)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{task.spent_hours}/{task.estimated_hours} {t("common.hoursShort")}</span>
                        {task.due_date && (
                          <span className={late ? "font-semibold text-red-400" : ""}>
                            {late ? "⚠ " : ""}{formatDate(task.due_date)}
                          </span>
                        )}
                      </div>

                      <select
                        className="mt-3 w-full rounded-lg border border-white/[0.08] bg-[#071021] px-2 py-1.5 text-xs text-slate-200 outline-none"
                        value={task.assigned_to ?? ""}
                        onChange={(e) => assign(task, e.target.value)}
                      >
                        <option value="">{t("chef.tasks.unassigned")}</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-slate-600">{t("chef.tasks.dropHere")}</p>}
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
                  {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
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
