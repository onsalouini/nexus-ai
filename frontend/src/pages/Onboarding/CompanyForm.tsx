import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function CompanyForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    employees_count: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value,
      }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await api.post("/company", {
        ...form,
        employees_count: form.employees_count
          ? Number(form.employees_count)
          : null,
      });

      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("Erreur création entreprise :", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Impossible d'enregistrer l'entreprise pour le moment."
        );
      } else {
        setError("Une erreur inattendue est survenue.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Cyan */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#22D3EE]/[0.06] blur-[140px]" />

        {/* Violet */}
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#8B5CF6]/[0.07] blur-[140px]" />

        {/* Center */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/[0.025] blur-[120px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/50 to-transparent" />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="relative z-10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-[#22D3EE]/25 blur-lg" />

              <img
                src="/nexus-logo.jpg"
                alt="NEXUS AI"
                className="relative h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
              />
            </div>

            <div>
              <div className="font-['Space_Grotesk',sans-serif] text-sm font-bold">
                NEXUS{" "}
                <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                  AI
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">
                  Intelligent workspace
                </span>
              </div>
            </div>
          </div>

          <div className="hidden rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 sm:block">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              Workspace setup
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 flex min-h-[calc(100vh-82px)] items-center justify-center px-5 pb-12 pt-6">
        <div className="w-full max-w-2xl">

          {/* Step */}
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-3.5 py-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22D3EE]/10 font-mono text-[9px] text-[#67E8F9]">
                01
              </span>

              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#67E8F9]">
                Configuration initiale
              </span>
            </div>
          </div>

          {/* Card */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#071021]/75 shadow-[0_25px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">

            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />

            <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#22D3EE]/[0.06] blur-[90px]" />

            <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-[#8B5CF6]/[0.06] blur-[90px]" />

            <div className="relative p-7 sm:p-10">

              {/* Logo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-5 rounded-[28px] bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 blur-2xl" />

                  <img
                    src="/nexus-logo.jpg"
                    alt="NEXUS AI"
                    className="relative h-20 w-20 rounded-[22px] object-cover ring-1 ring-white/10"
                  />
                </div>
              </div>

              {/* Heading */}
              <div className="mt-7 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#22D3EE]">
                  Workspace intelligence
                </p>

                <h1 className="mt-3 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Bienvenue
                  {user?.first_name ? `, ${user.first_name}` : ""} 👋
                </h1>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                  Configurez votre entreprise pour activer votre espace
                  intelligent NEXUS AI.
                </p>
              </div>

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.07]" />

                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-700">
                  Company profile
                </span>

                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-2xl border border-[#F2497A]/15 bg-[#F2497A]/[0.05] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F2497A] shadow-[0_0_8px_#F2497A]" />

                    <p className="text-sm leading-5 text-[#FDA4AF]">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Company name */}
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Nom de l'entreprise
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Ex. Anypli"
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-[#22D3EE]/[0.025] focus:ring-2 focus:ring-[#22D3EE]/10"
                  />
                </div>

                {/* Email / Phone */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      Email
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="contact@entreprise.com"
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-[#22D3EE]/[0.025] focus:ring-2 focus:ring-[#22D3EE]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      Téléphone
                    </label>

                    <input
                      value={form.phone}
                      onChange={update("phone")}
                      placeholder="+216 ..."
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-[#22D3EE]/[0.025] focus:ring-2 focus:ring-[#22D3EE]/10"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Adresse
                  </label>

                  <input
                    value={form.address}
                    onChange={update("address")}
                    placeholder="Adresse de l'entreprise"
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-[#22D3EE]/[0.025] focus:ring-2 focus:ring-[#22D3EE]/10"
                  />
                </div>

                {/* Industry / Employees */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      Secteur d'activité
                    </label>

                    <input
                      value={form.industry}
                      onChange={update("industry")}
                      placeholder="Agence digitale"
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-[#22D3EE]/[0.025] focus:ring-2 focus:ring-[#22D3EE]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      Nombre d'employés
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={form.employees_count}
                      onChange={update("employees_count")}
                      placeholder="25"
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-[#22D3EE]/40 focus:bg-[#22D3EE]/[0.025] focus:ring-2 focus:ring-[#22D3EE]/10"
                    />
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-3 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] p-[1px] shadow-[0_0_30px_rgba(34,211,238,0.10)] transition hover:shadow-[0_0_40px_rgba(34,211,238,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-12 items-center justify-center gap-2 rounded-[11px] bg-[#071021] text-sm font-semibold text-white transition group-hover:bg-transparent">

                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Initialisation...
                      </>
                    ) : (
                      <>
                        Accéder à mon tableau de bord

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Footer security */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-600"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
                  Environnement sécurisé · NEXUS AI
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-700">
              Project intelligence · predictive analytics · AI
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}