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
  // Incrémenté à chaque création réussie — les pages qui en ont besoin
  // (ex: ChefDashboard) l'écoutent via useOutletContext pour se recharger.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#030712] font-['Inter',sans-serif] text-white">
      <ChefSidebar />

      <div className="lg:pl-60">
        <ChefTopbar
          onCreateProject={() => setShowCreate(true)}
          onOpenTeam={() => setShowTeam(true)}
        />

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <Outlet context={{ refreshKey } satisfies ChefLayoutContext} />
        </main>
      </div>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      <TeamModal open={showTeam} onClose={() => setShowTeam(false)} />
    </div>
  );
}