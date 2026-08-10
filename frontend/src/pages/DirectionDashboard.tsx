import { useEffect, useState, FormEvent, useCallback } from "react";
import { api as apiClient } from "../lib/api";

type Invitation = {
  id: number;
  email: string;
  first_name: string | null;
  role: string;
  accepted_at: string | null;
  expires_at: string;
  created_at?: string;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

type FormData = {
  first_name: string;
  email: string;
  role: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  name?: string;
  message?: string;
};

// Type guard for Axios-like errors
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'name' in error || 'message' in error)
  );
}

// Type guard for Abort errors
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error.name === 'AbortError' || error.name === 'CanceledError')
  );
}

export default function DirectionDashboard() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>({ 
    first_name: "", 
    email: "", 
    role: "chef_de_projet" 
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadInvitations = useCallback(async () => {
    const abortController = new AbortController();
    
    try {
      const { data } = await apiClient.get<Invitation[]>("/invitations", {
        signal: abortController.signal
      });
      setInvitations(data);
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        console.error("Erreur chargement invitations", error);
        setFeedback({
          type: "error",
          text: "Impossible de charger les invitations."
        });
      }
    } finally {
      setLoading(false);
    }

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        const { data } = await apiClient.get<Invitation[]>("/invitations", {
          signal: abortController.signal
        });
        setInvitations(data);
      } catch (error: unknown) {
        if (!isAbortError(error)) {
          console.error("Erreur chargement invitations", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    return () => abortController.abort();
  }, []);

  // Auto-dismiss feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      setFeedback({
        type: "error",
        text: "L'email est requis."
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFeedback({
        type: "error",
        text: "Veuillez entrer une adresse email valide."
      });
      return false;
    }

    // Check for duplicate invitations
    const isEmailInvited = invitations.some(
      (inv) => inv.email.toLowerCase() === form.email.toLowerCase()
    );

    if (isEmailInvited) {
      setFeedback({
        type: "error",
        text: `Cet email a déjà été invité.`
      });
      return false;
    }

    return true;
  };

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      await apiClient.post("/invitations", form);
      setFeedback({ 
        type: "success", 
        text: `Invitation envoyée à ${form.email}` 
      });
      setForm({ first_name: "", email: "", role: "chef_de_projet" });
      await loadInvitations();
    } catch (error: unknown) {
      let errorMessage = "Impossible d'envoyer l'invitation.";
      
      if (isApiError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setFeedback({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setSending(false);
    }
  }

  const formatRole = (role: string): string => {
    return role.replace(/_/g, " ");
  };

  const sortedInvitations = [...invitations].sort((a, b) => {
    // Pending first, then by creation date (if available)
    if (a.accepted_at && !b.accepted_at) return 1;
    if (!a.accepted_at && b.accepted_at) return -1;
    if (a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Équipe
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Invitez vos chefs de projet — ils reçoivent un email avec un lien direct vers leur espace.
        </p>
      </div>

      {/* Formulaire d'invitation */}
      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end"
        role="form"
        aria-label="Formulaire d'invitation"
      >
        <div className="flex-1">
          <label 
            htmlFor="first_name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prénom
          </label>
          <input
            id="first_name"
            type="text"
            value={form.first_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setForm((f) => ({ ...f, first_name: e.target.value }))
            }
            placeholder="Optionnel"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            aria-label="Prénom du destinataire"
          />
        </div>

        <div className="flex-1">
          <label 
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="chef@entreprise.com"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            aria-label="Adresse email"
            aria-required="true"
          />
        </div>

        <div>
          <label 
            htmlFor="role"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Rôle
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
              setForm((f) => ({ ...f, role: e.target.value }))
            }
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            aria-label="Rôle du destinataire"
          >
            <option value="chef_de_projet">Chef de projet</option>
            <option value="agent_support">Agent support</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-brand-500 dark:hover:bg-brand-600"
          aria-busy={sending}
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
          role="alert"
          aria-live="polite"
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
          {loading && (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-400">Chargement...</p>
            </div>
          )}
          
          {!loading && invitations.length === 0 && (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-400">
                Aucune invitation envoyée pour l'instant.
              </p>
            </div>
          )}
          
          {!loading && sortedInvitations.map((inv) => (
            <div 
              key={inv.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {inv.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs capitalize text-gray-400">
                    {formatRole(inv.role)}
                  </p>
                  {inv.first_name && (
                    <span className="text-xs text-gray-400">
                      • {inv.first_name}
                    </span>
                  )}
                  {!inv.accepted_at && (
                    <span className="text-xs text-gray-400">
                      • Expire le: {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                  inv.accepted_at
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                }`}
              >
                {inv.accepted_at ? "✓ Compte créé" : "⏳ En attente"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}