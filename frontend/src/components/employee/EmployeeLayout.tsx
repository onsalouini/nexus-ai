import { useEffect } from "react";
import { NavLink, Outlet } from "react-router";
import { wakeAiServices } from "../../lib/wakeAi";
import { useTranslation } from "react-i18next";
import { CalendarDays, CheckSquare, FolderKanban, LifeBuoy, LogOut, MessagesSquare, Settings } from "lucide-react";
import { useAuth, getDashboardPath } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
import NotificationBell from "../common/NotificationBell";
import { roleLabel } from "../../i18n/labels";
import Avatar from "../ui-nexus/Avatar";
import UnreadMessagesBadge from "../common/UnreadMessagesBadge";

/* Espace des employés (agents support, membres d'équipe) et des clients externes */
export default function EmployeeLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const base = getDashboardPath(user?.role ?? null);
  const isSupport = user?.role === "agent_support";

  // Agents et clients créent des tickets : le service de tri doit être réveillé
  useEffect(wakeAiServices, []);

  const items =
    user?.role === "client"
      ? [
          { to: base, label: t("client.nav.projects"), Icon: FolderKanban, end: true },
          { to: `${base}/tickets`, label: t("client.nav.tickets"), Icon: LifeBuoy, end: false },
          { to: `${base}/messages`, label: t("nav.messages"), Icon: MessagesSquare, end: false },
          { to: `${base}/settings`, label: t("chef.sidebar.settings"), Icon: Settings, end: false },
        ]
      : [
          ...(isSupport ? [{ to: base, label: t("employee.nav.tickets"), Icon: LifeBuoy, end: true }] : []),
          { to: isSupport ? `${base}/tasks` : base, label: t("employee.nav.tasks"), Icon: CheckSquare, end: !isSupport },
          { to: `${base}/projects`, label: t("employee.nav.projects"), Icon: FolderKanban, end: false },
          { to: `${base}/planning`, label: t("employee.nav.planning"), Icon: CalendarDays, end: false },
          { to: `${base}/messages`, label: t("nav.messages"), Icon: MessagesSquare, end: false },
          { to: `${base}/settings`, label: t("chef.sidebar.settings"), Icon: Settings, end: false },
        ];

  return (
    <div className="min-h-screen bg-[#020817] font-['Inter',sans-serif] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#020817]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/nexus-logo.jpg" alt="NEXUS AI" className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/15" />
            <Avatar person={user} size="sm" />
            <div>
              <p className="text-sm font-semibold">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-cyan-300">
                {roleLabel(user?.role)}
                {user?.company ? ` · ${user.company.name}` : ""}
              </p>
            </div>
          </div>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:ms-6 sm:w-auto">
            {items.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? "bg-cyan-400/10 text-cyan-200" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
                {to.endsWith("/messages") && <UnreadMessagesBadge />}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={logout}
              aria-label={t("common.logout")}
              title={t("common.logout")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:border-red-400/30 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
