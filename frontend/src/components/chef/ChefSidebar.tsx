import { NavLink } from "react-router";
import {
  FolderKanban,
  Users,
  CheckSquare,
  BrainCircuit,
} from "lucide-react";

const NAV_ITEMS = [
  {
    to: "/dashboard/chef",
    label: "Mes projets",
    end: true,
    icon: FolderKanban,
  },
  {
    to: "/dashboard/chef/team",
    label: "Équipe",
    icon: Users,
  },
  {
    to: "/dashboard/chef/tasks",
    label: "Tâches",
    icon: CheckSquare,
  },
  {
    to: "/dashboard/chef/models",
    label: "Modèles IA",
    icon: BrainCircuit,
  },
];

export default function ChefSidebar() {
  return (
    <aside
      className="
        fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col
        border-r border-white/[0.08]
        bg-[#020617]/85
        backdrop-blur-2xl
        lg:flex
        shadow-[20px_0_60px_rgba(0,0,0,0.25)]
      "
    >
      {/* =====================================================
          BACKGROUND GLOW
      ====================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute -left-24 -top-24
            h-72 w-72 rounded-full
            bg-cyan-500/[0.08]
            blur-[100px]
          "
        />

        <div
          className="
            absolute -right-24 bottom-10
            h-72 w-72 rounded-full
            bg-violet-600/[0.07]
            blur-[100px]
          "
        />

        {/* subtle vertical line */}
        <div
          className="
            absolute right-0 top-0 h-full w-px
            bg-gradient-to-b
            from-transparent
            via-cyan-400/20
            to-transparent
          "
        />
      </div>

      {/* =====================================================
          LOGO
      ====================================================== */}
      <div className="relative border-b border-white/[0.07] px-5 py-5">
        <div className="flex items-center gap-3">
          
          {/* Logo container */}
          <div
            className="
              relative flex h-11 w-11 shrink-0 items-center justify-center
              overflow-hidden rounded-xl
              border border-white/10
              bg-white/[0.04]
              shadow-[0_0_25px_rgba(34,211,238,0.12)]
            "
          >
            {/* cyan glow behind logo */}
            <div
              className="
                absolute inset-0
                bg-gradient-to-br
                from-cyan-400/20
                via-transparent
                to-violet-500/20
              "
            />

            <img
              src="/nexus-logo.jpg"
              alt="NEXUS AI"
              className="
                relative z-10
                h-full w-full
                object-cover
              "
            />

            {/* glass reflection */}
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
          <div className="min-w-0">
            <div
              className="
                font-['Space_Grotesk',sans-serif]
                text-[15px] font-bold tracking-wide
                text-white
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
                font-medium
                uppercase
                tracking-[0.18em]
                text-slate-500
              "
            >
              Espace Chef de projet
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}
      <nav className="relative flex-1 px-3 py-6">
        
        <div className="mb-3 px-3">
          <span
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-slate-600
            "
          >
            Workspace
          </span>
        </div>

        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `
                  group relative flex items-center gap-3
                  rounded-xl px-3.5 py-3
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? `
                        border border-cyan-400/15
                        bg-gradient-to-r
                        from-cyan-400/[0.10]
                        via-blue-500/[0.06]
                        to-violet-500/[0.08]
                        text-white
                        shadow-[0_0_25px_rgba(34,211,238,0.05)]
                      `
                      : `
                        border border-transparent
                        text-slate-400
                        hover:border-white/[0.05]
                        hover:bg-white/[0.035]
                        hover:text-white
                      `
                  }
                `
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && (
                      <span
                        className="
                          absolute left-0
                          h-6 w-[2px]
                          rounded-r-full
                          bg-gradient-to-b
                          from-[#22D3EE]
                          to-[#8B5CF6]
                          shadow-[0_0_10px_#22D3EE]
                        "
                      />
                    )}

                    {/* Icon */}
                    <span
                      className={`
                        flex h-8 w-8 items-center justify-center
                        rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? `
                              bg-cyan-400/[0.10]
                              text-[#22D3EE]
                              shadow-[0_0_15px_rgba(34,211,238,0.08)]
                            `
                            : `
                              bg-white/[0.025]
                              text-slate-500
                              group-hover:bg-white/[0.05]
                              group-hover:text-slate-300
                            `
                        }
                      `}
                    >
                      <Icon size={17} strokeWidth={1.7} />
                    </span>

                    <span>{item.label}</span>

                    {/* Active glow dot */}
                    {isActive && (
                      <span
                        className="
                          ml-auto
                          h-1.5 w-1.5
                          rounded-full
                          bg-[#22D3EE]
                          shadow-[0_0_8px_#22D3EE]
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

      {/* =====================================================
          SYSTEM STATUS
      ====================================================== */}
      <div className="relative border-t border-white/[0.07] p-4">
        <div
          className="
            rounded-xl
            border border-white/[0.06]
            bg-white/[0.025]
            px-3.5 py-3
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
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
                  relative inline-flex
                  h-2 w-2
                  rounded-full
                  bg-[#22D3EE]
                  shadow-[0_0_10px_#22D3EE]
                "
              />
            </span>

            <span
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.14em]
                text-slate-500
              "
            >
              System operational
            </span>
          </div>

          <div className="mt-2 h-px bg-gradient-to-r from-cyan-400/20 via-violet-500/10 to-transparent" />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] text-slate-600">
              NEXUS CORE
            </span>

            <span className="text-[9px] font-medium text-cyan-400/70">
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}