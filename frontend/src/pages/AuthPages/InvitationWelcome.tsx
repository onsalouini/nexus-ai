import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../../lib/api";

const ROLE_CONTENT: Record<string, { title: string; points: string[] }> = {
  chef_de_projet: {
    title: "Bienvenue, futur Chef de projet",
    points: [
      "Créez vos projets et suivez leur risque de dérive, prédit et expliqué par IA",
      "Constituez votre équipe et assignez qui fait quoi sur chaque projet",
      "Invitez vos clients à suivre l'avancement de leur projet",
      "Recevez des alertes avant qu'un problème ne devienne critique",
    ],
  },
  agent_support: {
    title: "Bienvenue, futur Agent Support",
    points: [
      "Traitez une file de tickets déjà triée par urgence et sentiment",
      "Corrigez les classifications si besoin — vos retours améliorent le modèle",
      "Suivez vos statistiques de résolution",
    ],
  },
};

export default function InvitationWelcome() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }
    api
      .get(`/invitations/validate/${token}`)
      .then((res) => setRole(res.data.role))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Chargement...</div>;
  }

  if (error || !role) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-semibold text-gray-800">Invitation invalide ou expirée</p>
        <p className="text-sm text-gray-500">Demandez un nouveau lien à la personne qui vous a invité.</p>
      </div>
    );
  }

  const content = ROLE_CONTENT[role] ?? { title: "Bienvenue", points: [] };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">NEXUS AI</span>
        <h1 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{content.title}</h1>
        <ul className="mt-6 space-y-3">
          {content.points.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-brand-500">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <button
          onClick={() => navigate(`/invitation/complete?token=${token}`)}
          className="mt-8 w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}