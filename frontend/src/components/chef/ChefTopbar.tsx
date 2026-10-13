import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
import NotificationBell from "../common/NotificationBell";

import Avatar from "../ui-nexus/Avatar";
import {
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";

type Props = {
  onCreateProject: () => void;
  onOpenTeam: () => void;
};

export default function ChefTopbar({
  onCreateProject,
  onOpenTeam,
}: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const fullName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    t("chef.sidebar.user");


  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.055] bg-[#020817]/75 backdrop-blur-2xl">
      {/* Ligne lumineuse très discrète */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

      <div className="relative flex h-16 items-center justify-end px-4 sm:px-6 lg:px-8">
        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="flex items-center gap-1 sm:gap-1.5">

          {/* =================================================
              ÉQUIPE
          ================================================== */}

          <button
            type="button"
            onClick={onOpenTeam}
            aria-label={t("chef.topbar.openTeam")}
            className="
              group
              flex items-center gap-2
              rounded-lg
              px-2.5 py-2
              text-xs font-medium
              text-white/45
              transition-all duration-200
              hover:bg-white/[0.035]
              hover:text-white/85
            "
          >
            <Users
              size={16}
              strokeWidth={1.6}
              className="
                text-white/35
                transition-colors duration-200
                group-hover:text-cyan-300
              "
            />

            <span className="hidden sm:inline">
              {t("chef.topbar.team")}

            </span>
          </button>

          {/* =================================================
              NOUVEAU PROJET — ACTION PRINCIPALE
          ================================================== */}

          <button
            type="button"
            onClick={onCreateProject}
            className="
              group
              ms-1
              flex items-center gap-2
              rounded-lg
              border border-cyan-400/20
              bg-cyan-400/[0.07]
              px-3 py-2
              text-xs font-semibold
              text-cyan-100
              transition-all duration-200
              hover:border-cyan-400/35
              hover:bg-cyan-400/[0.11]
              hover:text-white
              hover:shadow-[0_0_22px_rgba(34,211,238,0.08)]
            "
          >
            <Plus
              size={15}
              strokeWidth={1.8}
              className="
                text-cyan-300
                transition-transform duration-200
                group-hover:rotate-90
              "
            />

            <span className="hidden sm:inline">
              {t("chef.topbar.newProject")}

            </span>

            <span className="sm:hidden">
              {t("chef.topbar.project")}

            </span>
          </button>

          {/* =================================================
              SEPARATOR
          ================================================== */}

          <div className="mx-1.5 hidden h-5 w-px bg-white/[0.07] sm:block" />

          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <NotificationBell />

          {/* =================================================
              LANGUAGE
          ================================================== */}

          <div className="hidden sm:flex items-center">
            <LanguageSwitcher />
          </div>

          {/* =================================================
              USER
          ================================================== */}

          <div className="relative ms-1">

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={t("chef.topbar.userMenu")}
              aria-expanded={menuOpen}
              className="
                group
                flex items-center gap-2
                rounded-full
                border border-transparent
                py-1 ps-1 pe-1.5
                transition-all duration-200
                hover:border-white/[0.07]
                hover:bg-white/[0.035]
              "
            >
              {/* Avatar */}

              <span className="relative inline-flex transition-all duration-200 group-hover:scale-105"><Avatar person={user} size="sm" /><span className="absolute bottom-0.5 end-0.5 h-1.5 w-1.5 rounded-full border border-[#020817] bg-cyan-400" /></span>

              {/* Prénom uniquement */}

              <span className="hidden max-w-[90px] truncate text-xs font-medium text-white/65 md:block">
                {user?.first_name || t("chef.sidebar.user")}
              </span>

              <ChevronDown
                size={13}
                strokeWidth={1.6}
                className={`
                  text-white/25
                  transition-all duration-200
                  ${
                    menuOpen
                      ? "rotate-180 text-cyan-300"
                      : "group-hover:text-white/50"
                  }
                `}
              />
            </button>

            {/* =================================================
                USER DROPDOWN
            ================================================== */}

            {menuOpen && (
              <>
                {/* Overlay pour fermer le menu */}

                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                {/* Dropdown */}

                <div
                  className="
                    absolute end-0 top-full z-50
                    mt-2.5
                    w-60
                    overflow-hidden
                    rounded-xl
                    border border-white/[0.08]
                    bg-[#071021]/95
                    p-1
                    shadow-[0_20px_50px_rgba(0,0,0,0.4)]
                    backdrop-blur-2xl
                  "
                >
                  {/* Petit accent */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      -end-10
                      -top-10
                      h-28 w-28
                      rounded-full
                      bg-cyan-400/[0.06]
                      blur-3xl
                    "
                  />

                  {/* =========================================
                      USER INFO
                  ========================================== */}

                  <div
                    className="
                      relative
                      border-b border-white/[0.06]
                      px-3
                      py-3
                    "
                  >
                    <div className="flex items-center gap-3">

                      <Avatar person={user} size="sm" className="h-9! w-9!" />

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white/85">
                          {fullName}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-white/30">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =========================================
                      SETTINGS
                  ========================================== */}

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/dashboard/chef/settings");
                    }}
                    className="
                      group
                      flex w-full items-center gap-3
                      rounded-lg
                      px-2.5 py-2.5
                      text-start
                      text-xs
                      text-white/50
                      transition-all duration-200
                      hover:bg-white/[0.04]
                      hover:text-white/85
                    "
                  >
                    <span
                      className="
                        flex h-7 w-7
                        items-center justify-center
                        rounded-lg
                        bg-white/[0.035]
                        text-white/30
                        transition-colors
                        group-hover:bg-cyan-400/[0.07]
                        group-hover:text-cyan-300
                      "
                    >
                      <Settings
                        size={14}
                        strokeWidth={1.6}
                      />
                    </span>

                    <span>
                      {t("nav.settings")}
                    </span>
                  </button>

                  {/* =========================================
                      LOGOUT
                  ========================================== */}

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="
                      group
                      flex w-full items-center gap-3
                      rounded-lg
                      px-2.5 py-2.5
                      text-start
                      text-xs
                      text-white/40
                      transition-all duration-200
                      hover:bg-red-500/[0.05]
                      hover:text-red-300
                    "
                  >
                    <span
                      className="
                        flex h-7 w-7
                        items-center justify-center
                        rounded-lg
                        bg-white/[0.03]
                        text-white/25
                        transition-colors
                        group-hover:bg-red-500/[0.07]
                        group-hover:text-red-300
                      "
                    >
                      <LogOut
                        size={14}
                        strokeWidth={1.6}
                      />
                    </span>

                    <span>
                      {t("nav.logout")}

                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}