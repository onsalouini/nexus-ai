import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
type Props = {
  onCreateProject: () => void;
  onOpenTeam: () => void;
};

export default function ChefTopbar({ onCreateProject, onOpenTeam }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="nexus-glass sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo reel */}
        <div className="flex items-center gap-3">
          <img
            src="/nexus-logo.jpg"
            alt="NEXUS AI"
            className="nexus-logo-glow h-10 w-10 rounded-[12px] object-cover"
          />
          <span className="font-['Space_Grotesk',sans-serif] text-base font-bold text-white/90">
            NEXUS <span className="nexus-gradient-text">AI</span>
          </span>
          <span className="ml-3 hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-gray-400 md:flex nexus-mono">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--nexus-cyan)] shadow-[0_0_8px_var(--nexus-cyan)]" />
            SYSTEM OPERATIONAL
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTeam}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-[var(--nexus-cyan)]/40 hover:text-white"
          >
            Équipe
          </button>

          <button
            onClick={onCreateProject}
            className="nexus-gradient-btn rounded-lg px-4 py-2 text-sm font-semibold transition"
          >
            + Projet
          </button>

          <button className="relative rounded-full p-2 text-gray-400 hover:bg-white/[0.05] hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z" fill="currentColor" />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--nexus-violet)] shadow-[0_0_6px_var(--nexus-violet)]" />
          </button>

          {/* Menu utilisateur */}
          <div className="relative">
         <LanguageSwitcher />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-white/[0.05]"
            >
              {user?.avatar_path ? (
                <img
                  src={user.avatar_path}
                  alt={user.first_name}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[var(--nexus-cyan)]/30"
                />
              ) : (
                <div className="nexus-gradient-btn flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                  {initials || "?"}
                </div>
              )}
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--nexus-cyan)]" />
                {user?.first_name}
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="nexus-glass absolute right-0 z-50 mt-2 w-52 rounded-xl p-1.5">
                  <div className="px-3 py-2 text-xs text-gray-400 nexus-mono">{user?.email}</div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/[0.05]"
                  >
                    Paramètres du compte
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--nexus-violet)] hover:bg-white/[0.05]"
                  >
                    Déconnexion
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