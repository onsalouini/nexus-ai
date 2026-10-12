import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import arLocale from "@fullcalendar/core/locales/ar";
import enGbLocale from "@fullcalendar/core/locales/en-gb";
import { CalendarDays, GanttChart } from "lucide-react";
import { normalizeLanguage } from "../../i18n";
import { formatDate } from "../../i18n/format";
import { statusLabel } from "../ui-nexus/kit";

export type PlanningProject = {
  id: number;
  name: string;
  status: string;
  progress?: number;
  start_date?: string | null;
  deadline?: string | null;
  created_at?: string | null;
};

export type PlanningTask = {
  id: number;
  title: string;
  status: string;
  priority?: string;
  due_date?: string | null;
  project_id?: number;
  project_name?: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#f87171",
  high: "#fbbf24",
  medium: "#22d3ee",
  low: "#94a3b8",
};

const DAY = 86_400_000;

function toTime(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export default function PlanningView({
  projects,
  tasks,
  onTaskClick,
}: {
  projects: PlanningProject[];
  tasks: PlanningTask[];
  onTaskClick?: (taskId: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<"calendar" | "gantt">("calendar");
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  /* ---------------- Calendrier : échéances des tâches + périodes des projets ---------------- */
  const events = useMemo(
    () => [
      ...projects
        .filter((p) => p.start_date || p.deadline)
        .map((p) => ({
          id: `p-${p.id}`,
          title: `📁 ${p.name}`,
          start: p.start_date ?? p.deadline ?? undefined,
          // FullCalendar : date de fin exclusive
          end: p.deadline ? new Date(new Date(p.deadline).getTime() + DAY).toISOString().slice(0, 10) : undefined,
          allDay: true,
          backgroundColor: "rgba(139,92,246,0.25)",
          borderColor: "rgba(139,92,246,0.6)",
        })),
      ...tasks
        .filter((task) => task.due_date)
        .map((task) => ({
          id: `t-${task.id}`,
          title: `${task.status === "done" ? "✓ " : ""}${task.title}`,
          start: task.due_date!,
          allDay: true,
          backgroundColor: task.status === "done" ? "rgba(52,211,153,0.25)" : `${PRIORITY_COLORS[task.priority ?? "medium"]}33`,
          borderColor: task.status === "done" ? "#34d399" : PRIORITY_COLORS[task.priority ?? "medium"],
          extendedProps: { taskId: task.id },
        })),
    ],
    [projects, tasks]
  );

  function handleEventClick(arg: EventClickArg) {
    const taskId = arg.event.extendedProps.taskId as number | undefined;
    if (taskId && onTaskClick) onTaskClick(taskId);
  }

  /* ---------------- Gantt : barre par projet sur l'axe du temps ---------------- */
  const gantt = useMemo(() => {
    const rows = projects
      .map((p) => {
        const start = toTime(p.start_date) ?? toTime(p.created_at);
        const end = toTime(p.deadline) ?? (start ? start + 30 * DAY : null);
        return start && end ? { ...p, start, end: Math.max(end, start + DAY) } : null;
      })
      .filter((row): row is PlanningProject & { start: number; end: number } => row !== null)
      .sort((a, b) => a.start - b.start);

    if (rows.length === 0) return null;

    const min = Math.min(...rows.map((r) => r.start));
    const max = Math.max(...rows.map((r) => r.end), Date.now() + 7 * DAY);
    const span = max - min;

    // Graduations mensuelles
    const months: { label: string; left: number }[] = [];
    const cursor = new Date(min);
    cursor.setDate(1);
    while (cursor.getTime() <= max) {
      const left = ((cursor.getTime() - min) / span) * 100;
      if (left >= 0) months.push({ label: formatDate(cursor, { month: "short", year: "2-digit" }), left });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const taskMarks = (projectId: number) =>
      tasks
        .filter((task) => task.project_id === projectId && toTime(task.due_date))
        .map((task) => ({ ...task, left: ((toTime(task.due_date)! - min) / span) * 100 }));

    return { rows, months, today: ((Date.now() - min) / span) * 100, pct: (x: number) => ((x - min) / span) * 100, taskMarks };
  }, [projects, tasks, language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
        {(
          [
            ["calendar", CalendarDays, t("planning.calendar")],
            ["gantt", GanttChart, t("planning.gantt")],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
              view === key ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <div className="nexus-calendar rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-4">
          <FullCalendar
            key={language}
            plugins={[dayGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            locales={[frLocale, arLocale, enGbLocale]}
            locale={language === "en" ? "en-gb" : language}
            direction={language === "ar" ? "rtl" : "ltr"}
            headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,listMonth" }}
            buttonText={{ today: t("planning.today"), month: t("planning.month"), list: t("planning.list") }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
          />
        </div>
      ) : !gantt ? (
        <p className="rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-10 text-center text-sm text-slate-400">
          {t("planning.noDates")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-4">
          <div className="min-w-[720px]">
            <div className="relative ms-[200px] h-6 border-b border-white/[0.06] text-[11px] text-slate-500">
              {gantt.months.map((m) => (
                <span key={m.left} className="absolute top-0 whitespace-nowrap" style={{ insetInlineStart: `${m.left}%` }}>
                  {m.label}
                </span>
              ))}
            </div>

            <div className="relative">
              {gantt.today >= 0 && gantt.today <= 100 && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-rose-400/70"
                  style={{ insetInlineStart: `calc(200px + (100% - 200px) * ${gantt.today / 100})` }}
                  title={t("planning.today")}
                />
              )}

              {gantt.rows.map((row) => {
                const left = gantt.pct(row.start);
                const width = Math.max(gantt.pct(row.end) - left, 1);
                return (
                  <div key={row.id} className="flex h-12 items-center border-b border-white/[0.04]">
                    <div className="w-[200px] shrink-0 pe-3">
                      <p className="truncate text-sm font-medium text-white">{row.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {statusLabel(row.status)} · {row.progress ?? 0}%
                      </p>
                    </div>
                    <div className="relative h-full flex-1">
                      <div
                        className="absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-md border border-violet-400/40 bg-violet-500/20"
                        style={{ insetInlineStart: `${left}%`, width: `${width}%` }}
                        title={`${formatDate(row.start)} → ${formatDate(row.end)}`}
                      >
                        <div className="h-full bg-gradient-to-r from-cyan-400/60 to-violet-400/60" style={{ width: `${row.progress ?? 0}%` }} />
                      </div>
                      {gantt.taskMarks(row.id).map((task) => (
                        <span
                          key={task.id}
                          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border border-[#071021]"
                          style={{
                            insetInlineStart: `calc(${task.left}% - 5px)`,
                            backgroundColor: task.status === "done" ? "#34d399" : PRIORITY_COLORS[task.priority ?? "medium"],
                          }}
                          title={`${task.title} — ${formatDate(task.due_date)}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded bg-violet-500/40" /> {t("planning.legendProject")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rotate-45 bg-cyan-400" /> {t("planning.legendTask")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-px bg-rose-400" /> {t("planning.today")}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
