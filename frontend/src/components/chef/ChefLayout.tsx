import { useState } from "react";
import { Outlet } from "react-router";
import ChefSidebar from "./ChefSidebar";
import ChefTopbar from "./ChefTopbar";
import CreateProjectModal from "./CreateProjectModal";
import TeamModal from "./TeamModal";

export type ChefLayoutContext = {
  refreshKey: number;
};

export default function ChefLayout() {
  const [showCreate, setShowCreate] = useState(false);
  const [showTeam, setShowTeam] = useState(false);

  // Incrémenté après chaque création réussie
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020617] font-['Inter',sans-serif] text-white">
      {/* =========================================================
          BACKGROUND NEXUS
      ========================================================== */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Cyan glow */}
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />

        {/* Violet glow */}
        <div className="absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-violet-600/[0.07] blur-[120px]" />

        {/* Blue bottom glow */}
        <div className="absolute bottom-[-250px] left-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[120px]" />

        {/* Subtle center glow */}
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.025] blur-[100px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* =========================================================
          SIDEBAR
      ========================================================== */}
      <ChefSidebar />

      {/* =========================================================
          MAIN AREA
      ========================================================== */}
      <div className="relative lg:pl-60">
        {/* Topbar */}
        <div className="sticky top-0 z-30">
          <ChefTopbar
            onCreateProject={() => setShowCreate(true)}
            onOpenTeam={() => setShowTeam(true)}
          />
        </div>

        {/* Content */}
        <main className="relative min-h-[calc(100vh-80px)]">
          {/* Content glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[70%] -translate-x-1/2 rounded-full bg-cyan-500/[0.025] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <Outlet
              context={{ refreshKey } satisfies ChefLayoutContext}
            />
          </div>
        </main>
      </div>

      {/* =========================================================
          CREATE PROJECT MODAL
      ========================================================== */}
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      {/* =========================================================
          TEAM MODAL
      ========================================================== */}
      <TeamModal
        open={showTeam}
        onClose={() => setShowTeam(false)}
      />
    </div>
  );
}