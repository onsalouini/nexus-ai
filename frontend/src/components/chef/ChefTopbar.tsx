import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Users,
  Plus,
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

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <header
      className="
        sticky top-0 z-40
        border-b border-white/[0.07]
        bg-[#020617]/75
        backdrop-blur-2xl
        shadow-[0_10px_40px_rgba(0,0,0,0.18)]
      "
    >
      {/* Subtle top gradient */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-px
          bg-gradient-to-r
          from-transparent
          via-[#22D3EE]/40
          to-transparent
        "
      />

      <div className="relative flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* =====================================================
            LEFT — BRAND
        ====================================================== */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Logo */}
          <div
            className="
              relative h-10 w-10 shrink-0
              overflow-hidden rounded-xl
              border border-white/10
              bg-white/[0.04]
              shadow-[0_0_25px_rgba(34,211,238,0.10)]
            "
          >
            <div
              className="
                absolute inset-0
                bg-gradient-to-br
                from-[#22D3EE]/20
                via-transparent
                to-[#8B5CF6]/20
              "
            />

            <img
              src="/nexus-logo.jpg"
              alt="NEXUS AI"
              className="relative z-10 h-full w-full object-cover"
            />

            {/* Glass reflection */}
            <div
              className="
                pointer-events-none absolute inset-x-0 top-0 z-20
                h-1/2
                bg-gradient-to-b
                from-white/10
                to-transparent
              "
            />
          </div>

          {/* Brand */}
          <div className="hidden sm:block">
            <div
              className="
                font-['Space_Grotesk',sans-serif]
                text-sm font-bold tracking-wide text-white
              "
            >
              NEXUS{" "}
              <span
                className="
                  bg-gradient-to-r
                  from-[#22D3EE]
                  via-[#3B82F6]
                  to-[#8B5CF6]
                  bg-clip-text
                  text-transparent
                "
              >
                AI
              </span>
            </div>

            <div
              className="
                mt-0.5
                text-[9px]
                uppercase
                tracking-[0.18em]
                text-slate-600
              "
            >
              Project workspace
            </div>
          </div>

          {/* System status */}
          <div
            className="
              ml-2 hidden items-center gap-2
              rounded-full
              border border-white/[0.07]
              bg-white/[0.025]
              px-3 py-1.5
              md:flex
            "
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="
                  absolute inline-flex h-full w-full
                  animate-ping rounded-full
                  bg-[#22D3EE]
                  opacity-50
                "
              />

              <span
                className="
                  relative h-1.5 w-1.5
                  rounded-full
                  bg-[#22D3EE]
                  shadow-[0_0_8px_#22D3EE]
                "
              />
            </span>

            <span
              className="
                font-mono
                text-[9px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-slate-500
              "
            >
              System operational
            </span>
          </div>
        </div>

        {/* =====================================================
            RIGHT — ACTIONS
        ====================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Team */}
          <button
            onClick={onOpenTeam}
            className="
              group flex items-center gap-2
              rounded-xl
              border border-white/[0.08]
              bg-white/[0.025]
              px-3 py-2
              text-sm font-medium
              text-slate-300
              transition-all duration-200
              hover:border-[#22D3EE]/20
              hover:bg-[#22D3EE]/[0.05]
              hover:text-white
            "
          >
            <Users
              size={16}
              strokeWidth={1.8}
              className="
                text-slate-500
                transition
                group-hover:text-[#22D3EE]
              "
            />

            <span className="hidden sm:inline">
              Équipe
            </span>
          </button>

          {/* Create project */}
          <button
            onClick={onCreateProject}
            className="
              group relative
              flex items-center gap-2
              overflow-hidden
              rounded-xl
              border border-[#22D3EE]/20
              bg-gradient-to-r
              from-[#22D3EE]/15
              via-[#3B82F6]/10
              to-[#8B5CF6]/15
              px-3.5 py-2
              text-sm font-semibold
              text-white
              shadow-[0_0_20px_rgba(34,211,238,0.06)]
              transition-all duration-200
              hover:border-[#22D3EE]/40
              hover:shadow-[0_0_25px_rgba(34,211,238,0.12)]
            "
          >
            <Plus
              size={16}
              strokeWidth={2}
              className="text-[#22D3EE]"
            />

            <span className="hidden sm:inline">
              Nouveau projet
            </span>

            <span className="sm:hidden">
              Projet
            </span>
          </button>

          {/* Separator */}
          <div className="mx-1 hidden h-7 w-px bg-white/[0.07] sm:block" />

          {/* Notifications */}
          <button
            className="
              group relative
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              text-slate-500
              transition
              hover:bg-white/[0.05]
              hover:text-white
            "
          >
            <Bell
              size={18}
              strokeWidth={1.7}
              className="transition group-hover:text-[#22D3EE]"
            />

            {/* Notification indicator */}
            <span
              className="
                absolute right-2 top-1.5
                h-1.5 w-1.5
                rounded-full
                bg-[#8B5CF6]
                shadow-[0_0_7px_#8B5CF6]
              "
            />
          </button>

          {/* Language */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* =================================================
              USER MENU
          ================================================== */}
          <div className="relative ml-1">
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="
                group flex items-center gap-2
                rounded-full
                border border-transparent
                py-1 pl-1 pr-2
                transition-all
                hover:border-white/[0.07]
                hover:bg-white/[0.04]
              "
            >
              {/* Avatar */}
              {user?.avatar_path ? (
                <div
                  className="
                    relative h-8 w-8
                    overflow-hidden rounded-full
                    ring-1 ring-[#22D3EE]/30
                    shadow-[0_0_12px_rgba(34,211,238,0.08)]
                  "
                >
                  <img
                    src={user.avatar_path}
                    alt={user.first_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="
                    flex h-8 w-8
                    items-center justify-center
                    rounded-full
                    bg-gradient-to-br
                    from-[#22D3EE]
                    via-[#3B82F6]
                    to-[#8B5CF6]
                    text-[11px]
                    font-bold
                    text-white
                    shadow-[0_0_15px_rgba(34,211,238,0.15)]
                  "
                >
                  {initials || "?"}
                </div>
              )}

              {/* Name */}
              <div className="hidden text-left md:block">
                <div className="flex items-center gap-1.5">
                  <span
                    className="
                      h-1.5 w-1.5
                      rounded-full
                      bg-[#22D3EE]
                      shadow-[0_0_6px_#22D3EE]
                    "
                  />

                  <span className="text-xs font-medium text-slate-200">
                    {user?.first_name || "Utilisateur"}
                  </span>
                </div>
              </div>

              <ChevronDown
                size={14}
                className={`
                  ml-0.5
                  text-slate-600
                  transition-transform duration-200
                  ${menuOpen ? "rotate-180 text-slate-400" : ""}
                `}
              />
            </button>

            {/* =================================================
                DROPDOWN
            ================================================== */}
            {menuOpen && (
              <>
                {/* Click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                <div
                  className="
                    absolute right-0 top-full z-50 mt-3
                    w-64
                    overflow-hidden
                    rounded-2xl
                    border border-white/[0.08]
                    bg-[#050A16]/95
                    p-1.5
                    shadow-[0_20px_60px_rgba(0,0,0,0.45)]
                    backdrop-blur-2xl
                  "
                >
                  {/* Dropdown glow */}
                  <div
                    className="
                      pointer-events-none
                      absolute -right-10 -top-10
                      h-32 w-32
                      rounded-full
                      bg-cyan-500/[0.07]
                      blur-3xl
                    "
                  />

                  {/* User information */}
                  <div
                    className="
                      relative
                      mb-1
                      border-b border-white/[0.06]
                      px-3 py-3
                    "
                  >
                    <div className="flex items-center gap-2.5">
                      {user?.avatar_path ? (
                        <img
                          src={user.avatar_path}
                          alt={user.first_name}
                          className="
                            h-9 w-9
                            rounded-full
                            object-cover
                            ring-1 ring-[#22D3EE]/30
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex h-9 w-9
                            items-center justify-center
                            rounded-full
                            bg-gradient-to-br
                            from-[#22D3EE]
                            to-[#8B5CF6]
                            text-xs font-bold
                          "
                        >
                          {initials || "?"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {user?.first_name} {user?.last_name}
                        </p>

                        <p
                          className="
                            mt-0.5 truncate
                            font-mono
                            text-[9px]
                            text-slate-500
                          "
                        >
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/settings");
                    }}
                    className="
                      group flex w-full items-center gap-3
                      rounded-xl
                      px-3 py-2.5
                      text-left text-sm
                      text-slate-300
                      transition
                      hover:bg-white/[0.05]
                      hover:text-white
                    "
                  >
                    <span
                      className="
                        flex h-8 w-8
                        items-center justify-center
                        rounded-lg
                        bg-white/[0.03]
                        text-slate-500
                        transition
                        group-hover:bg-cyan-400/[0.08]
                        group-hover:text-[#22D3EE]
                      "
                    >
                      <Settings size={15} strokeWidth={1.7} />
                    </span>

                    <span>Paramètres du compte</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="
                      group flex w-full items-center gap-3
                      rounded-xl
                      px-3 py-2.5
                      text-left text-sm
                      text-slate-400
                      transition
                      hover:bg-violet-500/[0.06]
                      hover:text-[#A78BFA]
                    "
                  >
                    <span
                      className="
                        flex h-8 w-8
                        items-center justify-center
                        rounded-lg
                        bg-white/[0.03]
                        text-slate-500
                        transition
                        group-hover:bg-violet-500/[0.08]
                        group-hover:text-[#A78BFA]
                      "
                    >
                      <LogOut size={15} strokeWidth={1.7} />
                    </span>

                    <span>Déconnexion</span>
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