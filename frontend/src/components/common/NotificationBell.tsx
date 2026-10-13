import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Bell,
  GitPullRequestArrow,
  MessagesSquare,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  LifeBuoy,
  MessageSquare,
  Sparkles,
  TrendingDown,
  UserCheck,
  X,
} from "lucide-react";
import { workspaceApi, type AppNotification, type NotificationType } from "../../services/workspaceApi";
import { formatDate, formatRelative } from "../../i18n/format";
import { riskLabel, roleLabel } from "../../i18n/labels";
import { pushToast } from "../../lib/toast";

const POLL_MS = 30_000;

const ICONS: Record<NotificationType, { Icon: typeof Bell; cls: string }> = {
  task_late: { Icon: CalendarClock, cls: "text-red-300 bg-red-500/10" },
  task_due_soon: { Icon: CalendarClock, cls: "text-amber-300 bg-amber-500/10" },
  task_assigned: { Icon: ClipboardList, cls: "text-cyan-300 bg-cyan-500/10" },
  task_completed: { Icon: CheckCircle2, cls: "text-emerald-300 bg-emerald-500/10" },
  project_high_risk: { Icon: AlertTriangle, cls: "text-orange-300 bg-orange-500/10" },
  project_risk_alert: { Icon: AlertTriangle, cls: "text-red-300 bg-red-500/15" },
  bankruptcy_alert: { Icon: TrendingDown, cls: "text-red-300 bg-red-500/15" },
  project_late_tasks: { Icon: CalendarClock, cls: "text-red-300 bg-red-500/10" },
  invitation_accepted: { Icon: UserCheck, cls: "text-emerald-300 bg-emerald-500/10" },
  ticket_critical: { Icon: LifeBuoy, cls: "text-rose-300 bg-rose-500/10" },
  ticket_new: { Icon: LifeBuoy, cls: "text-sky-300 bg-sky-500/10" },
  ticket_assigned: { Icon: LifeBuoy, cls: "text-violet-300 bg-violet-500/10" },
  ticket_reply: { Icon: MessageSquare, cls: "text-cyan-300 bg-cyan-500/10" },
  ticket_client_reply: { Icon: MessageSquare, cls: "text-amber-300 bg-amber-500/10" },
  ticket_in_progress: { Icon: LifeBuoy, cls: "text-violet-300 bg-violet-500/10" },
  ticket_resolved: { Icon: CheckCircle2, cls: "text-emerald-300 bg-emerald-500/10" },
  ai_report_auto: { Icon: Sparkles, cls: "text-violet-300 bg-violet-500/10" },
  message_new: { Icon: MessagesSquare, cls: "text-cyan-300 bg-cyan-500/15" },
  change_request_new: { Icon: GitPullRequestArrow, cls: "text-amber-300 bg-amber-500/10" },
  change_request_updated: { Icon: GitPullRequestArrow, cls: "text-emerald-300 bg-emerald-500/10" },
};

type Filter = "all" | "unread" | "alerts";

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastSeenId = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [coords, setCoords] = useState({ top: 0, end: 0 });

  const text = useCallback(
    (n: AppNotification): string => {
      const data = { ...n.data };
      if (typeof data.due_date === "string") data.due_date = formatDate(data.due_date);
      if (typeof data.risk_level === "string") data.risk_level = riskLabel(data.risk_level);
      if (typeof data.role === "string") data.role = roleLabel(data.role);
      if (typeof data.urgency === "string") data.urgency = t(`support.urgency.${data.urgency}`);
      if (typeof data.status === "string") data.status = t(`changes.status.${data.status}`);
      return t(`notifications.types.${n.type}`, data);
    },
    [t]
  );

  // Nouvelles notifications depuis le dernier passage : toast + notification système pour les alertes
  const announce = useCallback(
    (fresh: AppNotification[]) => {
      fresh.slice(0, 3).forEach((n) => {
        pushToast(text(n), n.severity === "critical" ? "error" : "info");
        const desktop = typeof Notification !== "undefined" && Notification.permission === "granted";
        if (desktop && (n.severity === "critical" || document.hidden)) {
          try {
            new Notification("NEXUS AI", { body: text(n), tag: `nexus-${n.id}`, icon: "/nexus-logo.jpg" });
          } catch {
            /* certains navigateurs refusent hors service worker */
          }
        }
      });
    },
    [text]
  );

  const load = useCallback(async () => {
    try {
      const data = await workspaceApi.notifications();
      setItems(data.notifications);
      setUnread(data.unread);

      const maxId = data.notifications.reduce((max, n) => Math.max(max, n.id), 0);
      if (lastSeenId.current !== null) {
        announce(data.notifications.filter((n) => n.id > lastSeenId.current! && !n.read));
      }
      lastSeenId.current = Math.max(lastSeenId.current ?? 0, maxId);
    } catch {
      /* les notifications sont un confort : une erreur ne doit pas gêner la navigation */
    }
  }, [announce]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, POLL_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const rtl = document.documentElement.dir === "rtl";
      setCoords({ top: rect.bottom + 8, end: rtl ? rect.left : window.innerWidth - rect.right });
      void load();
    }
    setOpen((v) => !v);
  }

  async function markAllRead() {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await workspaceApi.markNotificationsRead();
    } catch {
      void load();
    }
  }

  async function openItem(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      workspaceApi.markNotificationRead(n.id).then((r) => setUnread(r.unread)).catch(() => undefined);
    }
    if (n.link) navigate(n.link);
  }

  async function remove(n: AppNotification) {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.read) setUnread((u) => Math.max(0, u - 1));
    try {
      const r = await workspaceApi.deleteNotification(n.id);
      setUnread(r.unread);
    } catch {
      void load();
    }
  }

  const visible = items.filter((n) =>
    filter === "unread" ? !n.read : filter === "alerts" ? n.severity !== "info" : true
  );
  const hasCritical = items.some((n) => !n.read && n.severity === "critical");

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={t("notifications.title")}
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white/[0.03] transition hover:border-cyan-400/25 hover:text-cyan-300 ${
          hasCritical ? "border-red-400/40 text-red-300" : "border-white/[0.08] text-white/50"
        }`}
      >
        <Bell size={17} className={hasCritical ? "animate-[wiggle_1s_ease-in-out_2]" : ""} />
        {unread > 0 && (
          <span
            className={`absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              hasCritical ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]" : "bg-rose-500"
            }`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label={t("common.close")}
              className="fixed inset-0 z-[9998] cursor-default"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-[9999] w-[min(400px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#070D1C]/95 shadow-2xl backdrop-blur-2xl"
              style={{ top: coords.top, insetInlineEnd: Math.max(coords.end, 12) }}
              role="dialog"
              aria-label={t("notifications.title")}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  {t("notifications.title")}
                  {unread > 0 && <span className="ms-2 rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-200">{unread}</span>}
                </p>
                {unread > 0 && (
                  <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-cyan-300 hover:underline">
                    <CheckCheck className="h-3.5 w-3.5" />
                    {t("notifications.markAllRead")}
                  </button>
                )}
              </div>

              <div className="flex gap-1 border-b border-white/[0.06] px-3 py-2">
                {(["all", "unread", "alerts"] as Filter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-lg px-3 py-1 text-xs transition ${
                      filter === key ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t(`notifications.filters.${key}`)}
                  </button>
                ))}
              </div>

              <div className="max-h-[440px] overflow-y-auto">
                {visible.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-slate-500">{t("notifications.empty")}</p>
                ) : (
                  visible.map((n) => {
                    const { Icon, cls } = ICONS[n.type] ?? ICONS.task_late;
                    return (
                      <div
                        key={n.id}
                        className={`group relative flex items-start border-b border-white/[0.04] transition hover:bg-white/[0.04] ${
                          n.severity === "critical" ? "border-s-2 border-s-red-500/70 bg-red-500/[0.04]" : ""
                        } ${n.read ? "opacity-60" : ""}`}
                      >
                        <button type="button" onClick={() => openItem(n)} className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-start">
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            {n.severity === "critical" && (
                              <span className="mb-1 inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-200">
                                {t("notifications.critical")}
                              </span>
                            )}
                            <span className="block text-sm leading-5 text-slate-200">{text(n)}</span>
                            <span className="mt-1 block text-[11px] text-slate-500">{formatRelative(n.created_at)}</span>
                          </span>
                          {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(n)}
                          aria-label={t("notifications.delete")}
                          title={t("notifications.delete")}
                          className="me-2 mt-3 rounded-md p-1 text-slate-500 opacity-0 transition hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
