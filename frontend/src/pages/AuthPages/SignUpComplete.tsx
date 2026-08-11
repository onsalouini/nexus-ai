import { FormEvent, ChangeEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function SignUpComplete() {
  const { registerWithFiles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", password_confirmation: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
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
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("invitation_token", token);
      if (avatar) fd.append("avatar", avatar);
      if (cv) fd.append("cv", cv);

      const { needsCompanySetup } = await registerWithFiles(fd);
      navigate(needsCompanySetup ? "/onboarding/entreprise" : "/dashboard");
    } catch (err) {
  const message =
    err && typeof err === "object" && "response" in err
      ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
  setError(message ?? "Impossible de créer le compte.");
}finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">Finalisez votre compte</h1>

        {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}

        {/* Avatar */}
        <div className="mt-6 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            {avatarPreview && <img src={avatarPreview} alt="Aperçu" className="h-full w-full object-cover" />}
          </div>
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
            Photo de profil
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
            <input required value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <input required value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-white" />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-white" />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-white" />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
          <input type="password" required value={form.password_confirmation} onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-white" />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            CV (PDF, optionnel)
          </label>
          <input type="file" accept="application/pdf" onChange={(e) => setCv(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500" />
        </div>

        <button type="submit" disabled={loading}
          className="mt-6 w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-600">
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}