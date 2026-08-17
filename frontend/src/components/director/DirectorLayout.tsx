import { Outlet } from "react-router";
import DirectorSidebar from "./DirectorSidebar";

export default function DirectorLayout() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <DirectorSidebar />

      <main className="min-h-screen pl-0 lg:pl-[292px]">
        <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}