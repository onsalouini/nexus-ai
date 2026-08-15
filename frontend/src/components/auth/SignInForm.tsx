import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth, getDashboardPath } from "../../context/AuthContext";

export default function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

 async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);

try {
    const { needsCompanySetup, role } = await login(email, password);

    if (needsCompanySetup) {
      navigate("/onboarding/entreprise", { replace: true });
      return;
    }

    navigate(getDashboardPath(role), { replace: true });
  } catch (err) {
    const message =
      err instanceof Error && "response" in err
        ? (err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }).response?.data?.message
        : undefined;

    setError(
      message ??
        "Impossible de se connecter. Vérifie ton email et ton mot de passe."
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nom@entreprise.com"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
          Créer le compte de mon entreprise
        </Link>
      </p>
    </form>
  );
}