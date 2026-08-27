import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type TeamMember = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  job_title?: string | null;
  avatar_path?: string | null;
};

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/chef/team");

        setMembers(response.data.members ?? []);
      } catch (err) {
        console.error("Erreur récupération équipe :", err);
        setError("Impossible de charger les membres de votre équipe.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-8 text-center backdrop-blur-xl">
        <p className="text-sm text-slate-400">
          Chargement de votre équipe...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Mon équipe
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Les membres associés à votre équipe.
        </p>
      </div>

      {/* Nombre de membres */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Membres de l'équipe
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {members.length}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-2xl">
            👥
          </div>
        </div>
      </div>

      {/* Liste */}
      {members.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-10 text-center backdrop-blur-xl">
          <div className="text-4xl">👥</div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            Aucun membre dans votre équipe
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Les membres que vous inviterez apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-white/[0.08] bg-[#071021]/70 p-5 backdrop-blur-xl transition hover:border-cyan-400/30"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
                  {member.first_name?.charAt(0)}
                  {member.last_name?.charAt(0)}
                </div>

                {/* Informations */}
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">
                    {member.first_name} {member.last_name}
                  </h3>

                  <p className="truncate text-sm text-slate-400">
                    {member.job_title || member.role}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                <p className="truncate text-sm text-slate-400">
                  ✉️ {member.email}
                </p>

                <p className="text-sm text-slate-500">
                  Rôle :{" "}
                  <span className="text-slate-300">
                    {member.role}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}