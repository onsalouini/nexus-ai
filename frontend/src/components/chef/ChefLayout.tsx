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

  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020817] font-['Inter',sans-serif] text-white">
      {/* =========================================================
          NEXUS BACKGROUND
      ========================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Cyan */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.045] blur-[140px]" />

        {/* Violet */}
        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-violet-600/[0.045] blur-[140px]" />

        {/* Blue */}
        <div className="absolute bottom-[-250px] left-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/[0.035] blur-[140px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
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
          MAIN APPLICATION
      ========================================================== */}

      {/*
        IMPORTANT :
        Sidebar = left-4 + 260px
        donc contenu commence après environ 292px.
      */}

      <div className="min-h-screen lg:pl-[292px]">
        {/* =======================================================
            TOPBAR
        ======================================================== */}

        <div className="sticky top-0 z-40">
          <ChefTopbar
            onCreateProject={() => setShowCreate(true)}
            onOpenTeam={() => setShowTeam(true)}
          />
        </div>

        {/* =======================================================
            CONTENT
        ======================================================== */}

        <main className="relative">
          {/* subtle top glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-[70%] -translate-x-1/2 rounded-full bg-cyan-500/[0.018] blur-3xl" />

          <div className="relative mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-7 lg:px-8 xl:px-10">
            <Outlet
              context={{
                refreshKey,
              }}
            />
          </div>
        </main>
      </div>

      {/* =========================================================
          CREATE PROJECT
      ========================================================== */}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setRefreshKey((value) => value + 1)}
      />

      {/* =========================================================
          TEAM
      ========================================================== */}

      <TeamModal
        open={showTeam}
        onClose={() => setShowTeam(false)}
      />
    </div>
  );
}