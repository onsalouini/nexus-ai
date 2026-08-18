import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";

import {
  Bell,
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const fullName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Utilisateur";

  const initials =
    `${user?.first_name?.charAt(0) ?? ""}${
      user?.last_name?.charAt(0) ?? ""
    }`.toUpperCase() || "N";

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
            aria-label="Ouvrir l'équipe"
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
              Équipe
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
              ml-1
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
              Nouveau projet
            </span>

            <span className="sm:hidden">
              Projet
            </span>
          </button>

          {/* =================================================
              SEPARATOR
          ================================================== */}

          <div className="mx-1.5 hidden h-5 w-px bg-white/[0.07] sm:block" />

          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <button
            type="button"
            aria-label="Notifications"
            className="
              group
              relative
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-white/35
              transition-all duration-200
              hover:bg-white/[0.035]
              hover:text-white/80
            "
          >
            <Bell
              size={17}
              strokeWidth={1.6}
              className="
                transition-colors duration-200
                group-hover:text-cyan-300
              "
            />

            {/* Notification indicator */}
            <span
              className="
                absolute
                right-[8px]
                top-[7px]
                h-1.5 w-1.5
                rounded-full
                bg-cyan-400
                shadow-[0_0_7px_rgba(34,211,238,0.7)]
              "
            />
          </button>

          {/* =================================================
              LANGUAGE
          ================================================== */}

          <div className="hidden sm:flex items-center">
            <LanguageSwitcher />
          </div>

          {/* =================================================
              USER
          ================================================== */}

          <div className="relative ml-1">

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Menu utilisateur"
              aria-expanded={menuOpen}
              className="
                group
                flex items-center gap-2
                rounded-full
                border border-transparent
                py-1 pl-1 pr-1.5
                transition-all duration-200
                hover:border-white/[0.07]
                hover:bg-white/[0.035]
              "
            >
              {/* Avatar */}

              {user?.avatar_path ? (
                <div
                  className="
                    relative
                    h-8 w-8
                    overflow-hidden
                    rounded-full
                    ring-1 ring-white/[0.10]
                    transition-all duration-200
                    group-hover:ring-cyan-400/30
                  "
                >
                  <img
                    src={user.avatar_path}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />

                  <span
                    className="
                      absolute
                      bottom-0.5 right-0.5
                      h-1.5 w-1.5
                      rounded-full
                      border border-[#020817]
                      bg-cyan-400
                    "
                  />
                </div>
              ) : (
                <div
                  className="
                    relative
                    flex h-8 w-8
                    items-center justify-center
                    rounded-full
                    bg-gradient-to-br
                    from-cyan-400
                    via-blue-500
                    to-violet-500
                    text-[10px]
                    font-semibold
                    text-white
                    ring-1 ring-white/[0.08]
                  "
                >
                  {initials}

                  <span
                    className="
                      absolute
                      bottom-0.5 right-0.5
                      h-1.5 w-1.5
                      rounded-full
                      border border-[#020817]
                      bg-cyan-300
                    "
                  />
                </div>
              )}

              {/* Prénom uniquement */}

              <span className="hidden max-w-[90px] truncate text-xs font-medium text-white/65 md:block">
                {user?.first_name || "Utilisateur"}
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
                    absolute right-0 top-full z-50
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
                      -right-10
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

                      {user?.avatar_path ? (
                        <img
                          src={user.avatar_path}
                          alt={fullName}
                          className="
                            h-9 w-9
                            rounded-full
                            object-cover
                            ring-1 ring-white/[0.10]
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex h-9 w-9
                            items-center justify-center
                            rounded-full
                            bg-gradient-to-br
                            from-cyan-400
                            to-violet-500
                            text-[10px]
                            font-semibold
                            text-white
                          "
                        >
                          {initials}
                        </div>
                      )}

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
                      navigate("/settings");
                    }}
                    className="
                      group
                      flex w-full items-center gap-3
                      rounded-lg
                      px-2.5 py-2.5
                      text-left
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
                      Paramètres du compte
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
                      text-left
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
                      Déconnexion
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