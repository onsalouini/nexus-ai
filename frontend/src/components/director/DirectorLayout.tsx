import { useEffect } from "react";
import { Outlet } from "react-router";
import { wakeAiServices } from "../../lib/wakeAi";
import DirectorSidebar from "./DirectorSidebar";
import NotificationBell from "../common/NotificationBell";

export default function DirectorLayout() {
  useEffect(wakeAiServices, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <DirectorSidebar />

      <main className="min-h-screen ps-0 lg:ps-[292px]">
        {/* Barre supérieure : notifications */}
        <div className="sticky top-0 z-30 flex justify-end px-4 pt-4 sm:px-6 lg:px-8">
          <NotificationBell />
        </div>
        <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}