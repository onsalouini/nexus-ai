import { useEffect, useState, FormEvent } from "react";
import { api as apiClient } from "../lib/api";

type Invitation = {
  id: number;
  email: string;
  first_name: string | null;
  role: string;
  accepted_at: string | null;
  expires_at: string;
};

export default function DirectionDashboard() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: "", email: "", role: "chef_de_projet" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadInvitations() {
    try {
      const { data } = await apiClient.get("/invitations");
      setInvitations(data);
    } catch (err) {
      console.error("Erreur chargement invitations", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      await apiClient.post("/invitations", form);
      setFeedback({ type: "success", text: `Invitation envoyée à ${form.email}` });
      setForm({ first_name: "", email: "", role: "chef_de_projet" });
      loadInvitations();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.response?.data?.message ?? "Impossible d'envoyer l'invitation.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Équipe</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Invitez vos chefs de projet — ils reçoivent un email avec un lien direct vers leur espace.
        </p>
      </div>

      {/* Formulaire d'invitation */}
      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Prénom
          </label>
          <input
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            placeholder="Optionnel"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
          />
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="chef@entreprise.com"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rôle
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
          >
            <option value="chef_de_projet">Chef de projet</option>
            <option value="agent_support">Agent support</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          {sending ? "Envoi..." : "Inviter"}
        </button>
      </form>

      {feedback && (
        <div
          className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Liste des invitations */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Invitations envoyées
        </h2>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-white/[0.03]">
          {loading && <p className="px-5 py-6 text-sm text-gray-400">Chargement...</p>}
          {!loading && invitations.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400">Aucune invitation envoyée pour l'instant.</p>
          )}
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{inv.email}</p>
                <p className="text-xs capitalize text-gray-400">{inv.role.replace(/_/g, " ")}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  inv.accepted_at
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                }`}
              >
                {inv.accepted_at ? "Compte créé" : "En attente"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}