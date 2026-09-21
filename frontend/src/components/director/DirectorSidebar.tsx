import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  FolderKanban,
  Home,
  LogOut,
  Mail,
  Menu,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  {
    label: "Vue générale",
    path: "/dashboard/direction",
    icon: Home,
  },
  {
    label: "Projets",
    path: "/dashboard/direction/projects",
    icon: FolderKanban,
  },
  {
    label: "Équipe",
    path: "/dashboard/direction/team",
    icon: Users,
  },
  {
    label: "Invitations",
    path: "/dashboard/direction/invitations",
    icon: Mail,
  },
  {
    label: "Monitoring",
    path: "/dashboard/direction/monitoring",
    icon: Activity,
  },
  {
    label: "Analytics",
    path: "/dashboard/direction/analytics",
    icon: BarChart3,
  },
  {
    label: "NEXUS AI",
    path: "/dashboard/direction/model",
        icon: BrainCircuit,
  },
  {
    label: "Paramètres",
    path: "/dashboard/direction/settings",
    icon: Settings,
  },
];

export default function DirectorSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("nexus_token");
    navigate("/signin");
  };

  const fullName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Utilisateur";

  const initials =
    `${user?.first_name?.charAt(0) ?? ""}${user?.last_name?.charAt(0) ?? ""}` ||
    "N";

  const role =
    user?.role === "direction"
      ? "Direction"
      : user?.role ?? "Administrateur";

  /*
   * ==========================================================
   * ESCAPE
   * ==========================================================
   */

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /*
   * ==========================================================
   * BLOQUER LE SCROLL MOBILE
   * ==========================================================
   */

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  /*
   * ==========================================================
   * FERMETURE MOBILE SUR DESKTOP
   * ==========================================================
   */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* ======================================================
          MOBILE MENU BUTTON
      ====================================================== */}

      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen(true)}
        className="
          fixed left-4 top-4 z-[60]
          flex h-11 w-11 items-center justify-center
          rounded-xl
          border border-white/10
          bg-[#020817]/80
          text-white
          shadow-xl shadow-black/30
          backdrop-blur-2xl
          transition-all duration-200
          hover:border-cyan-400/30
          hover:bg-cyan-400/[0.08]
          lg:hidden
        "
      >
        <Menu className="h-5 w-5 text-cyan-300" />
      </button>

      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      <div
        aria-hidden={!isMobileOpen}
        onClick={() => setIsMobileOpen(false)}
        className={`
          fixed inset-0 z-40
          bg-black/60
          backdrop-blur-[3px]
          transition-opacity duration-300
          lg:hidden
          ${
            isMobileOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          bottom-3
          left-3
          top-3
          z-50
          w-[min(86vw,320px)]
          overflow-hidden
          rounded-[26px]

          border border-white/[0.10]

          bg-slate-950/[0.72]

          shadow-[0_20px_70px_rgba(0,0,0,0.55)]

          backdrop-blur-2xl
          backdrop-saturate-150

          transition-transform
          duration-300
          ease-out

          lg:bottom-4
          lg:left-4
          lg:top-4
          lg:w-[260px]
          lg:translate-x-0

          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-[calc(100%+20px)]"
          }
        `}
      >
        {/* ====================================================
            GLASS HIGHLIGHT
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-400/40
            to-transparent
          "
        />

        {/* ====================================================
            BACKGROUND GLOWS
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -left-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-cyan-500/[0.10]
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            top-1/3
            h-56
            w-56
            rounded-full
            bg-blue-600/[0.07]
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -right-24
            h-64
            w-64
            rounded-full
            bg-violet-600/[0.10]
            blur-3xl
          "
        />

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="relative flex h-full min-h-0 flex-col">
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between px-3 pt-3">
            <Link
              to="/"
              onClick={() => setIsMobileOpen(false)}
              className="
                group
                flex
                min-w-0
                flex-1
                items-center
                gap-3
                rounded-2xl
                border
                border-transparent
                px-3
                py-3
                transition-all
                duration-200
                hover:border-white/[0.05]
                hover:bg-white/[0.04]
              "
            >
              <div className="relative shrink-0">
                <div
                  className="
                    absolute
                    inset-0
                    rounded-xl
                    bg-cyan-400/20
                    opacity-0
                    blur-xl
                    transition
                    duration-300
                    group-hover:opacity-100
                  "
                />

                <img
                  src="/nexus-logo.jpg"
                  alt="NEXUS"
                  className="
                    relative
                    h-11
                    w-11
                    rounded-xl
                    object-cover
                    ring-1
                    ring-white/10
                    transition
                    duration-300
                    group-hover:scale-105
                    group-hover:ring-cyan-400/30
                  "
                />
              </div>

              <div className="min-w-0">
                <p className="text-lg font-bold tracking-wide text-white">
                  NEXUS
                </p>

                <p className="truncate text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                  Intelligence
                </p>
              </div>
            </Link>

            {/* Mobile close */}

            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setIsMobileOpen(false)}
              className="
                ml-2
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                text-white/50
                transition
                hover:border-cyan-400/20
                hover:bg-white/[0.06]
                hover:text-white
                lg:hidden
              "
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ==================================================
              USER
          ================================================== */}

          <div className="border-b border-white/[0.06] px-5 py-4 sm:py-5">
            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.07]
                bg-white/[0.025]
                p-3
                shadow-inner
                shadow-white/[0.015]
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-8
                  -top-8
                  h-20
                  w-20
                  rounded-full
                  bg-violet-500/[0.10]
                  blur-2xl
                "
              />

              <div className="relative flex min-w-0 items-center gap-3">
                {/* Avatar */}

                <div className="relative shrink-0">
                  <div
                    className="
                      absolute
                      inset-0
                      rounded-full
                      bg-cyan-400/20
                      blur-md
                    "
                  />

                  {user?.avatar_path ? (
                    <img
                      src={user.avatar_path}
                      alt={fullName}
                      className="
                        relative
                        h-10
                        w-10
                        rounded-full
                        border
                        border-cyan-400/30
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        relative
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-cyan-400/25
                        bg-gradient-to-br
                        from-cyan-400/15
                        via-blue-500/10
                        to-violet-500/15
                      "
                    >
                      <span className="text-sm font-semibold text-cyan-200">
                        {initials.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Online indicator */}

                  <span
                    className="
                      absolute
                      bottom-0
                      right-0
                      h-2.5
                      w-2.5
                      rounded-full
                      border-2
                      border-[#06101f]
                      bg-cyan-400
                      shadow-[0_0_8px_#22D3EE]
                    "
                  />
                </div>

                {/* User information */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {fullName}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              NAVIGATION
          ================================================== */}

          <nav
            className="
              nexus-scrollbar
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
              px-3
              py-4
              sm:py-5
            "
          >
            {/* Section separator */}

            <div className="mb-3 flex items-center gap-2 px-3">
              <span className="h-px flex-1 bg-white/[0.05]" />

              <span
                className="
                  h-1
                  w-1
                  rounded-full
                  bg-cyan-400/50
                  shadow-[0_0_8px_rgba(34,211,238,0.5)]
                "
              />

              <span className="h-px flex-1 bg-white/[0.05]" />
            </div>

            {/* Navigation items */}

            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard/direction"}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      [
                        "group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",

                        isActive
                          ? `
                            border
                            border-cyan-400/15
                            bg-gradient-to-r
                            from-cyan-400/[0.10]
                            via-blue-500/[0.06]
                            to-violet-500/[0.08]
                            text-white
                            shadow-[0_0_25px_rgba(34,211,238,0.05)]
                          `
                          : `
                            border
                            border-transparent
                            text-white/40
                            hover:border-white/[0.05]
                            hover:bg-white/[0.035]
                            hover:text-white/80
                          `,
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator */}

                        {isActive && (
                          <span
                            className="
                              absolute
                              bottom-2
                              left-0
                              top-2
                              w-[2px]
                              rounded-full
                              bg-gradient-to-b
                              from-cyan-300
                              to-violet-400
                              shadow-[0_0_10px_rgba(34,211,238,0.8)]
                            "
                          />
                        )}

                        {/* Icon */}

                        <Icon
                          size={17}
                          strokeWidth={isActive ? 2 : 1.7}
                          className={
                            isActive
                              ? "shrink-0 text-cyan-300"
                              : "shrink-0 text-white/35 transition group-hover:text-cyan-300"
                          }
                        />

                        {/* Label */}

                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>

                        {/* Active dot */}

                        {isActive && (
                          <span
                            className="
                              h-1.5
                              w-1.5
                              shrink-0
                              rounded-full
                              bg-cyan-300
                              shadow-[0_0_10px_#22D3EE]
                            "
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="shrink-0 border-t border-white/[0.06] p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="
                group
                flex
                min-h-[44px]
                w-full
                items-center
                gap-3
                rounded-xl
                border
                border-transparent
                px-3
                py-3
                text-sm
                text-white/35
                transition-all
                duration-200
                hover:border-red-400/10
                hover:bg-red-500/[0.05]
                hover:text-red-300
              "
            >
              <LogOut
                size={17}
                strokeWidth={1.7}
                className="shrink-0 transition group-hover:text-red-300"
              />

              <span>Déconnexion</span>
            </button>

            {/* Footer branding */}

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="h-1 w-1 rounded-full bg-cyan-400/60" />

              <span className="truncate text-[9px] uppercase tracking-[0.18em] text-white/20">
                NEXUS Intelligence
              </span>

              <span className="h-1 w-1 rounded-full bg-violet-400/60" />
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================
          SCROLLBAR STYLE
      ====================================================== */}

      <style>{`
        .nexus-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 211, 238, 0.22) transparent;
        }

        .nexus-scrollbar::-webkit-scrollbar {
          width: 5px;
        }

        .nexus-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .nexus-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgba(34, 211, 238, 0.28),
            rgba(139, 92, 246, 0.28)
          );
          border-radius: 999px;
        }

        .nexus-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            to bottom,
            rgba(34, 211, 238, 0.55),
            rgba(139, 92, 246, 0.55)
          );
        }
      `}</style>
    </>
  );
}