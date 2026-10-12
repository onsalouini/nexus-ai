import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Bell, CalendarClock, CheckCheck, LifeBuoy, Sparkles, UserCheck } from "lucide-react";
import { workspaceApi, type AppNotification } from "../../services/workspaceApi";
import { formatDate, formatRelative } from "../../i18n/format";
import { riskLabel, roleLabel } from "../../i18n/labels";

const POLL_MS = 60_000;

const ICONS: Record<AppNotification["type"], { Icon: typeof Bell; cls: string }> = {
  task_late: { Icon: CalendarClock, cls: "text-red-300 bg-red-500/10" },
  task_due_soon: { Icon: CalendarClock, cls: "text-amber-300 bg-amber-500/10" },
  project_high_risk: { Icon: AlertTriangle, cls: "text-orange-300 bg-orange-500/10" },
  project_late_tasks: { Icon: CalendarClock, cls: "text-red-300 bg-red-500/10" },
  invitation_accepted: { Icon: UserCheck, cls: "text-emerald-300 bg-emerald-500/10" },
  ticket_critical: { Icon: LifeBuoy, cls: "text-rose-300 bg-rose-500/10" },
  ai_report_auto: { Icon: Sparkles, cls: "text-violet-300 bg-violet-500/10" },
};

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [coords, setCoords] = useState({ top: 0, end: 0 });

  const load = useCallback(async () => {
    try {
      const data = await workspaceApi.notifications();
      setItems(data.notifications);
      setUnread(data.unread);
    } catch {
      /* les notifications sont un confort : une erreur ne doit pas gêner la navigation */
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const rtl = document.documentElement.dir === "rtl";
      setCoords({ top: rect.bottom + 8, end: rtl ? rect.left : window.innerWidth - rect.right });
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

  function text(n: AppNotification): string {
    const data = { ...n.data };
    if (typeof data.due_date === "string") data.due_date = formatDate(data.due_date);
    if (typeof data.risk_level === "string") data.risk_level = riskLabel(data.risk_level);
    if (typeof data.role === "string") data.role = roleLabel(data.role);
    return t(`notifications.types.${n.type}`, data);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={t("notifications.title")}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 transition hover:border-cyan-400/25 hover:text-cyan-300"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
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
              className="fixed z-[9999] w-[min(380px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#070D1C]/95 shadow-2xl backdrop-blur-2xl"
              style={{ top: coords.top, insetInlineEnd: Math.max(coords.end, 12) }}
              role="dialog"
              aria-label={t("notifications.title")}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <p className="text-sm font-semibold text-white">{t("notifications.title")}</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    {t("notifications.markAllRead")}
                  </button>
                )}
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-slate-500">{t("notifications.empty")}</p>
                ) : (
                  items.map((n) => {
                    const { Icon, cls } = ICONS[n.type] ?? ICONS.task_late;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-start transition hover:bg-white/[0.04] ${
                          n.read ? "opacity-60" : ""
                        }`}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-5 text-slate-200">{text(n)}</span>
                          <span className="mt-1 block text-[11px] text-slate-500">{formatRelative(n.created_at)}</span>
                        </span>
                        {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
                      </button>
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
