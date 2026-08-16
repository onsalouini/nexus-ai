import { NavLink } from "react-router";

const NAV_ITEMS = [
  {
    to: "/dashboard/chef",
    label: "Mes projets",
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 4h10v4H7z" />
        <path d="M4 8h16v8H4z" />
        <path d="M7 16h10v4H7z" />
        <path d="M8 8v8M16 8v8" />
      </svg>
    ),
  },
  {
    to: "/dashboard/chef/team",
    label: "Équipe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="9" cy="7" r="3" />
        <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
        <circle cx="17" cy="7" r="2.3" />
        <path d="M22 21v-1a5 5 0 0 0-3.5-4.8" />
      </svg>
    ),
  },
  {
    to: "/dashboard/chef/tasks",
    label: "Tâches",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="4" width="6" height="16" rx="1" />
        <rect x="9.5" y="4" width="6" height="10" rx="1" />
        <rect x="16" y="4" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    to: "/dashboard/chef/models",
    label: "Modèles IA",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    ),
  },
];

export default function ChefSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-white/[0.07] bg-[#050A16]/90 backdrop-blur-xl lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5">
        <img
          src="/nexus-logo.jpg"
          alt="NEXUS AI"
          className="h-9 w-9 rounded-[10px] object-cover ring-1 ring-white/10"
        />
        <div>
          <div className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-white/90">
            NEXUS <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">AI</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-slate-600">Espace Chef de projet</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border border-[#22D3EE]/20 bg-[#22D3EE]/[0.08] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`
            }
          >
            <span className={item.to === "/dashboard/chef" ? "" : "text-slate-500"}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div className="border-t border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-slate-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
          System operational
        </div>
      </div>
    </aside>
  );
}