import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { workspaceApi, type MyTask } from "../../services/workspaceApi";
import type { TaskStatus } from "../../services/chefApi";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Stat, btnGhost, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";
import { SkeletonRows } from "../../components/ui-nexus/Skeleton";
import { formatDate } from "../../i18n/format";
import { toast } from "../../lib/toast";
import { exportRows } from "../../utils/export";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];
const PRIORITY_CLS: Record<string, string> = {
  critical: "text-red-300 bg-red-500/10",
  high: "text-amber-300 bg-amber-400/10",
  medium: "text-cyan-300 bg-cyan-400/10",
  low: "text-slate-300 bg-white/[0.05]",
};

type Filter = "open" | "late" | "done" | "all";

export default function MyTasksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("open");
  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      setTasks(await workspaceApi.myTasks());
    } catch (e) {
      toast.error(errMsg(e, t("employee.tasks.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const isLate = (task: MyTask) => task.status !== "done" && !!task.due_date && task.due_date < today;

  const visible = useMemo(
    () =>
      tasks.filter((task) =>
        filter === "all" ? true : filter === "done" ? task.status === "done" : filter === "late" ? isLate(task) : task.status !== "done"
      ),
    [tasks, filter] // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function save(task: MyTask, patch: { status?: TaskStatus; spent_hours?: number }) {
    try {
      const updated = await workspaceApi.updateMyTask(task.id, patch);
      setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, ...updated } : x)));
      toast.success(t("employee.tasks.saved"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  function exportTasks(format: "csv" | "xlsx") {
    void exportRows(format, `${t("employee.nav.tasks")}-${user?.last_name ?? ""}`, [
      { header: t("chef.tasks.titleLabel"), value: (task: MyTask) => task.title },
      { header: t("chef.tasks.project"), value: (task: MyTask) => task.project?.name ?? "" },
      { header: t("chef.editProject.status"), value: (task: MyTask) => t(`chef.tasks.status.${task.status}`) },
      { header: t("chef.tasks.priorityLabel"), value: (task: MyTask) => t(`chef.tasks.priority.${task.priority}`) },
      { header: t("chef.editProject.deadline"), value: (task: MyTask) => task.due_date ?? "" },
      { header: t("chef.tasks.estimated"), value: (task: MyTask) => task.estimated_hours },
      { header: t("chef.tasks.spent"), value: (task: MyTask) => task.spent_hours },
    ], visible);
  }

  const counts = {
    open: tasks.filter((x) => x.status !== "done").length,
    late: tasks.filter(isLate).length,
    done: tasks.filter((x) => x.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("employee.tasks.title")}
        subtitle={t("employee.tasks.subtitle")}
        action={
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => exportTasks("csv")} disabled={!visible.length}>CSV</button>
            <button className={btnGhost} onClick={() => exportTasks("xlsx")} disabled={!visible.length}>Excel</button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat tone="sky" label={t("employee.tasks.open")} value={counts.open} />
        <Stat tone="rose" label={t("employee.tasks.late")} value={<span className={counts.late ? "text-red-400" : ""}>{counts.late}</span>} />
        <Stat tone="emerald" label={t("employee.tasks.done")} value={counts.done} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["open", "late", "done", "all"] as Filter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              filter === key ? "border-cyan-400/40 bg-cyan-400/10 text-white" : "border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            {t(`employee.tasks.filters.${key}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows count={4} />
      ) : visible.length === 0 ? (
        <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("employee.tasks.empty")}</div>
      ) : (
        <div className="space-y-3">
          {visible.map((task) => (
            <div key={task.id} className={`${cardCls} p-4 ${isLate(task) ? "border-red-500/25" : ""}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${task.status === "done" ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {task.project?.name}
                    {task.due_date && (
                      <span className={isLate(task) ? "text-red-300" : ""}>
                        {" · "}
                        {isLate(task) ? "⚠ " : ""}
                        {t("employee.tasks.due", { date: formatDate(task.due_date) })}
                      </span>
                    )}
                  </p>
                  {task.description && <p className="mt-2 text-sm text-slate-400">{task.description}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${PRIORITY_CLS[task.priority]}`}>
                  {t(`chef.tasks.priority.${task.priority}`)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  aria-label={t("chef.editProject.status")}
                  className={`${inputCls} !w-auto`}
                  value={task.status}
                  onChange={(e) => save(task, { status: e.target.value as TaskStatus })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`chef.tasks.status.${s}`)}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  {t("chef.tasks.spent")}
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    defaultValue={task.spent_hours}
                    onBlur={(e) => {
                      const value = Number(e.target.value);
                      if (value !== task.spent_hours) void save(task, { spent_hours: value });
                    }}
                    className={`${inputCls} !w-24`}
                  />
                  / {task.estimated_hours} {t("common.hoursShort")}
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
