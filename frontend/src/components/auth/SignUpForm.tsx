import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function SignUpForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.password_confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      // needsCompanySetup vaut toujours true juste après une inscription
      await register(form);
      navigate("/onboarding/entreprise");
    } catch (err: unknown) {
      setError(
        (err as Error)?.message ??
          "Impossible de créer le compte. Vérifie les champs et réessaie."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Prénom</label>
          <input
            required
            value={form.first_name}
            onChange={update("first_name")}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nom</label>
          <input
            required
            value={form.last_name}
            onChange={update("last_name")}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email professionnel</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={update("email")}
          placeholder="nom@entreprise.com"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={update("password")}
          placeholder="8 caractères minimum"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Confirmer le mot de passe
        </label>
        <input
          type="password"
          required
          value={form.password_confirmation}
          onChange={update("password_confirmation")}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Déjà un compte ?{" "}
        <Link to="/signin" className="font-semibold text-indigo-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}