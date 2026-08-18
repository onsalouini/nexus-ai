import {
  BrainCircuit,
  CheckSquare,
  FolderKanban,
  LogOut,
  Users,
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
    label: "Mes projets",
    path: "/dashboard/chef",
    icon: FolderKanban,
  },
  {
    label: "Équipe",
    path: "/dashboard/chef/team",
    icon: Users,
  },
  {
    label: "Tâches",
    path: "/dashboard/chef/tasks",
    icon: CheckSquare,
  },
  {
    label: "Modèles IA",
    path: "/dashboard/chef/models",
    icon: BrainCircuit,
  },
];

export default function ChefSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleLogout() {
    localStorage.removeItem("nexus_token");
    navigate("/signin");
  }

  const fullName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Utilisateur";

  const initials =
    `${user?.first_name?.charAt(0) ?? ""}${
      user?.last_name?.charAt(0) ?? ""
    }` || "N";

  const role =
    user?.role === "chef_de_projet"
      ? "Chef de projet"
      : user?.role ?? "Chef de projet";

  return (
    <aside className="fixed bottom-4 left-4 top-4 z-50 hidden w-[260px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#020817]/90 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:block">
      {/* =====================================================
          NEXUS BACKGROUND GLOWS
      ===================================================== */}

      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-24 top-1/3 h-56 w-56 rounded-full bg-blue-600/[0.07] blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative flex h-full flex-col">

        {/* =====================================================
            LOGO
        ===================================================== */}

        <Link
          to="/"
          className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.05]"
        >
          <div className="relative">
            {/* Glow */}

            <div className="absolute inset-0 rounded-xl bg-cyan-400/20 opacity-0 blur-xl transition group-hover:opacity-100" />

            <img
              src="/nexus-logo.jpg"
              alt="NEXUS"
              className="relative h-11 w-11 rounded-xl object-cover ring-1 ring-white/10 transition duration-300 group-hover:scale-105 group-hover:ring-cyan-400/30"
            />
          </div>

          <div>
            <p className="text-lg font-bold tracking-wide text-white">
              NEXUS
            </p>

            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">
              Intelligence
            </p>
          </div>
        </Link>

        {/* =====================================================
            CONNECTED USER
        ===================================================== */}

        <div className="border-b border-white/[0.06] px-5 py-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">

            {/* Violet glow */}

            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-violet-500/10 blur-2xl" />

            <div className="relative flex items-center gap-3">

              {/* Avatar */}

              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md" />

                {user?.avatar_path ? (
                  <img
                    src={user.avatar_path}
                    alt={fullName}
                    className="relative h-10 w-10 rounded-full border border-cyan-400/30 object-cover"
                  />
                ) : (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-violet-500/15">
                    <span className="text-sm font-semibold text-cyan-200">
                      {initials.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Online indicator */}

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#06101f] bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
              </div>

              {/* User information */}

              <div className="min-w-0">
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

        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          {/* Workspace */}

          <div className="mb-3 flex items-center gap-2 px-3">
            <span className="h-px flex-1 bg-white/[0.05]" />

            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Workspace
            </p>

            <span className="h-px flex-1 bg-white/[0.05]" />
          </div>

          <div className="space-y-1">

            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard/chef"}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",

                      isActive
                        ? "border border-cyan-400/15 bg-gradient-to-r from-cyan-400/[0.10] via-blue-500/[0.06] to-violet-500/[0.08] text-white shadow-[0_0_25px_rgba(34,211,238,0.05)]"
                        : "border border-transparent text-white/40 hover:border-white/[0.05] hover:bg-white/[0.035] hover:text-white/80",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active glow line */}

                      {isActive && (
                        <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-gradient-to-b from-cyan-300 to-violet-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                      )}

                      {/* Icon */}

                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2 : 1.7}
                        className={
                          isActive
                            ? "text-cyan-300"
                            : "text-white/35 transition group-hover:text-cyan-300"
                        }
                      />

                      {/* Label */}

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {/* Active dot */}

                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#22D3EE]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

          </div>
        </nav>

        {/* =====================================================
            FOOTER / LOGOUT
        ===================================================== */}

        <div className="border-t border-white/[0.06] p-3">

          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-white/35 transition-all duration-200 hover:border-red-400/10 hover:bg-red-500/[0.05] hover:text-red-300"
          >
            <LogOut
              size={17}
              strokeWidth={1.7}
              className="transition group-hover:text-red-300"
            />

            <span>Déconnexion</span>
          </button>

          <div className="mt-3 flex items-center justify-center gap-2">

            <span className="h-1 w-1 rounded-full bg-cyan-400/60" />

            <span className="text-[9px] uppercase tracking-[0.18em] text-white/20">
              NEXUS Intelligence
            </span>

            <span className="h-1 w-1 rounded-full bg-violet-400/60" />

          </div>
        </div>
      </div>
    </aside>
  );
}