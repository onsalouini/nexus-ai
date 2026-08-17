import { useEffect, useState, FormEvent } from "react";
import {
  Check,
  Clock3,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  UserPlus,
  ArrowRight,
  Building2,
} from "lucide-react";

import { api as apiClient } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Invitation = {
  id: number;
  email: string;
  first_name: string | null;
  role: string;
  accepted_at: string | null;
  expires_at: string;
};

type Tab = "invite" | "list";

export default function DirectorInvitations() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("invite");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    email: "",
    role: "chef_de_projet",
  });

  const [sending, setSending] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadInvitations() {
    setLoading(true);

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

      setFeedback({
        type: "success",
        text: `Invitation envoyée à ${form.email}`,
      });

      setForm({
        first_name: "",
        email: "",
        role: "chef_de_projet",
      });

      await loadInvitations();
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? (
              err as {
                response?: {
                  data?: {
                    message?: string;
                  };
                };
              }
            ).response?.data?.message
          : undefined;

      setFeedback({
        type: "error",
        text: message ?? "Impossible d'envoyer l'invitation.",
      });
    } finally {
      setSending(false);
    }
  }

  const pending = invitations.filter((i) => !i.accepted_at).length;
  const accepted = invitations.filter((i) => i.accepted_at).length;

  return (
    <div className="relative min-h-full overflow-hidden bg-[#020817] text-white">
      {/* ================================================================ */}
      {/* BACKGROUND                                                        */}
      {/* ================================================================ */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        <div className="absolute right-[-180px] top-[15%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.07] blur-[130px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[450px] w-[450px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
      </div>

      {/* ================================================================ */}
      {/* MAIN                                                              */}
      {/* ================================================================ */}

      <div className="relative px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl">

          {/* ============================================================ */}
          {/* HEADER                                                        */}
          {/* ============================================================ */}

          <header className="mb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                    NEXUS • Équipe
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Votre{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                    équipe
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Invitez les collaborateurs de votre organisation et
                  gérez leurs accès à l'environnement NEXUS.
                </p>
              </div>

              {/* Company */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 backdrop-blur-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10">
                  <Building2 className="h-4 w-4 text-cyan-300" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Organisation
                  </p>

                  <p className="mt-0.5 text-sm font-medium text-white">
                    {user?.company?.name ?? "Votre entreprise"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* ============================================================ */}
          {/* HERO                                                          */}
          {/* ============================================================ */}

          <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.07] via-transparent to-violet-500/[0.08]" />

            <div className="absolute right-[-80px] top-[-100px] h-64 w-64 rounded-full bg-cyan-500/[0.08] blur-3xl" />

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/10">
                    <Users className="h-6 w-6 text-cyan-300" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />

                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                        Team Management
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-white sm:text-2xl">
                      Construisez votre équipe NEXUS
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Ajoutez les membres de votre organisation afin de leur
                      permettre d'accéder aux outils et espaces qui leur sont
                      dédiés.
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-3">
                  <MiniStat
                    value={pending}
                    label="En attente"
                    icon={<Clock3 className="h-4 w-4" />}
                  />

                  <MiniStat
                    value={accepted}
                    label="Actifs"
                    icon={<Check className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* TABS                                                           */}
          {/* ============================================================ */}

          <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1.5 backdrop-blur-xl">

            <button
              onClick={() => setActiveTab("invite")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === "invite"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.08)]"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <UserPlus className="h-4 w-4" />

              Inviter un membre
            </button>

            <button
              onClick={() => {
                setActiveTab("list");
                loadInvitations();
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === "list"
                  ? "bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.08)]"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Mail className="h-4 w-4" />

              Invitations

              {invitations.length > 0 && (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                  {invitations.length}
                </span>
              )}
            </button>
          </div>

          {/* ============================================================ */}
          {/* INVITE TAB                                                     */}
          {/* ============================================================ */}

          {activeTab === "invite" && (
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-2xl">

              <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-500/[0.06] blur-3xl" />

              <div className="relative p-6 sm:p-8 lg:p-10">

                <div className="mb-8">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                    <Send className="h-5 w-5 text-cyan-300" />
                  </div>

                  <h3 className="text-xl font-semibold text-white">
                    Inviter un collaborateur
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Envoyez une invitation sécurisée à un membre de votre
                    organisation. Il pourra ensuite compléter son profil et
                    accéder à son espace NEXUS.
                  </p>
                </div>

                <form onSubmit={handleInvite}>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                    {/* First name */}
                    <div>
                      <label className="mb-2.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                        Prénom
                      </label>

                      <input
                        value={form.first_name}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            first_name: e.target.value,
                          }))
                        }
                        placeholder="Ex. Mohamed"
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#020817]/70 px-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-cyan-400/40 focus:bg-cyan-400/[0.025] focus:ring-1 focus:ring-cyan-400/20"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-2.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                        Adresse email
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              email: e.target.value,
                            }))
                          }
                          placeholder="membre@entreprise.com"
                          className="h-12 w-full rounded-xl border border-white/10 bg-[#020817]/70 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-cyan-400/40 focus:bg-cyan-400/[0.025] focus:ring-1 focus:ring-cyan-400/20"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="mb-2.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                        Fonction
                      </label>

                      <select
                        value={form.role}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            role: e.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#020817]/70 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20"
                      >
                        <option
                          value="chef_de_projet"
                          className="bg-[#020817]"
                        >
                          Chef de projet
                        </option>

                        <option
                          value="agent_support"
                          className="bg-[#020817]"
                        >
                          Agent support
                        </option>
                      </select>
                    </div>

                    {/* Submit */}
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={sending}
                        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(34,211,238,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />

                        {sending ? "Envoi..." : "Envoyer l'invitation"}

                        {!sending && (
                          <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Feedback */}
                {feedback && (
                  <div
                    className={`mt-6 flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm ${
                      feedback.type === "success"
                        ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                        : "border-red-400/20 bg-red-400/[0.06] text-red-300"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                    )}

                    {feedback.text}
                  </div>
                )}

                {/* Security message */}
                <div className="mt-7 flex items-center gap-2 border-t border-white/[0.06] pt-5">
                  <ShieldCheck className="h-4 w-4 text-cyan-400/50" />

                  <p className="text-xs text-slate-600">
                    Les invitations sont sécurisées et automatiquement
                    rattachées à votre organisation.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================ */}
          {/* LIST TAB                                                       */}
          {/* ============================================================ */}

          {activeTab === "list" && (
            <div className="space-y-6">

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">

                <StatCard
                  icon={<Mail className="h-4 w-4" />}
                  label="Invitations envoyées"
                  value={invitations.length}
                  accent="cyan"
                />

                <StatCard
                  icon={<Clock3 className="h-4 w-4" />}
                  label="En attente"
                  value={pending}
                  accent="violet"
                />

                <StatCard
                  icon={<Check className="h-4 w-4" />}
                  label="Membres activés"
                  value={accepted}
                  accent="emerald"
                />
              </div>

              {/* List */}
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-2xl">

                <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Historique des invitations
                    </h3>

                    <p className="mt-1 text-xs text-slate-600">
                      Suivez les invitations envoyées aux membres de votre
                      organisation.
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05]">
                    <Mail className="h-4 w-4 text-cyan-300/70" />
                  </div>
                </div>

                {loading && (
                  <div className="flex flex-col items-center px-6 py-16 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

                    <p className="mt-4 text-sm text-slate-600">
                      Chargement des invitations...
                    </p>
                  </div>
                )}

                {!loading && invitations.length === 0 && (
                  <div className="px-6 py-16 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <Mail className="h-6 w-6 text-slate-600" />
                    </div>

                    <h4 className="mt-5 text-sm font-semibold text-slate-300">
                      Aucune invitation
                    </h4>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-600">
                      Les invitations que vous envoyez aux collaborateurs de
                      votre organisation apparaîtront ici.
                    </p>
                  </div>
                )}

                {!loading && invitations.length > 0 && (
                  <div className="divide-y divide-white/[0.05]">

                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="group flex flex-col gap-4 px-6 py-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="flex items-center gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05]">
                            <Mail className="h-4 w-4 text-cyan-300/70" />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-200">
                              {inv.first_name
                                ? `${inv.first_name} — `
                                : ""}
                              {inv.email}
                            </p>

                            <p className="mt-1 text-xs capitalize text-slate-600">
                              {inv.role.replace(/_/g, " ")}
                            </p>
                          </div>

                        </div>

                        <div>
                          {inv.accepted_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-xs font-medium text-emerald-300">
                              <Check className="h-3 w-3" />
                              Compte activé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/15 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-medium text-violet-300">
                              <Clock3 className="h-3 w-3" />
                              En attente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* MINI STAT                                                                  */
/* ========================================================================== */

type MiniStatProps = {
  value: number;
  label: string;
  icon: React.ReactNode;
};

function MiniStat({ value, label, icon }: MiniStatProps) {
  return (
    <div className="min-w-[90px] rounded-xl border border-white/10 bg-black/10 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-[10px] uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-1 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* STAT CARD                                                                  */
/* ========================================================================== */

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "cyan" | "violet" | "emerald";
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: StatCardProps) {
  const styles = {
    cyan: {
      icon: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
      glow: "bg-cyan-500/[0.05]",
    },

    violet: {
      icon: "border-violet-400/20 bg-violet-400/10 text-violet-300",
      glow: "bg-violet-500/[0.05]",
    },

    emerald: {
      icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      glow: "bg-emerald-500/[0.05]",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">

      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles[accent].glow}`}
      />

      <div className="relative">

        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${styles[accent].icon}`}
        >
          {icon}
        </div>

        <p className="text-xs text-slate-600">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>

      </div>
    </div>
  );
}