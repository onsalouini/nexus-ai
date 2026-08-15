import { FormEvent, useState } from "react";
import { api } from "../../lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const LANGUAGES = [
  { value: 1, label: "React / Laravel" },
  { value: 2, label: "Python" },
  { value: 3, label: "Java / Spring" },
  { value: 4, label: "PHP natif" },
  { value: 5, label: "Autre" },
];

const initial = {
  name: "",
  description: "",
  team_exp: 2,
  manager_exp: 3,
  length: 3,
  transactions: 50,
  entities: 10,
  points_non_adjust: 150,
  adjustment: 1,
  language: 1,
  planned_effort: 1000,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-300">
        {label}

        {hint && (
          <span className="group relative">
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[10px] font-bold text-cyan-300">
              ?
            </span>

            <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-300 opacity-0 shadow-2xl backdrop-blur-xl transition-opacity duration-200 group-hover:opacity-100">
              {hint}
            </span>
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-400/10 hover:border-white/20";

const textareaClass =
  "w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-400/10 hover:border-white/20";

export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initial>(
    key: K,
    value: (typeof initial)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/projects", form);

      setForm(initial);
      onCreated();
      onClose();
    } catch (err) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err
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

      setError(message ?? "Impossible de créer le projet.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-md">

      {/* Ambient Nexus glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[15%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[15%] h-80 w-80 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      {/* Modal */}
      <div className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#07111f]/95 shadow-[0_25px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl">

        {/* Top gradient line */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Header */}
        <div className="border-b border-white/[0.07] px-7 pb-6 pt-7">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-4">

              {/* Nexus icon */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                <div className="absolute inset-2 rounded-xl border border-cyan-300/20" />

                <svg
                  className="h-6 w-6 text-cyan-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M7 4h10v4H7z" />
                  <path d="M4 8h16v8H4z" />
                  <path d="M7 16h10v4H7z" />
                  <path d="M8 8v8M16 8v8" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">
                    Nouveau projet
                  </h2>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
                    AI Analysis
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Configurez les paramètres du projet pour lancer l'analyse Nexus.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* AI information */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-gradient-to-r from-cyan-400/[0.06] to-violet-500/[0.05] px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              ✦
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              Ces données alimentent le modèle IA de prédiction de risque.
              Plus les informations sont précises, plus l'estimation sera fiable.
            </p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-7 px-7 py-7">

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
              <span>⚠</span>
              {error}
            </div>
          )}

          {/* GENERAL */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/30 to-transparent" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                Informations générales
              </span>

              <div className="h-px flex-1 bg-gradient-to-l from-cyan-400/30 to-transparent" />
            </div>

            <div className="space-y-4">

              <Field label="Nom du projet">
                <input
                  required
                  className={inputClass}
                  placeholder="Ex. Nexus CRM"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={2}
                  className={textareaClass}
                  placeholder="Décrivez brièvement le projet..."
                  value={form.description}
                  onChange={(e) =>
                    update("description", e.target.value)
                  }
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <Field label="Durée prévue (mois)">
                  <input
                    type="number"
                    min={1}
                    required
                    className={inputClass}
                    value={form.length}
                    onChange={(e) =>
                      update("length", Number(e.target.value))
                    }
                  />
                </Field>

                <Field label="Technologie principale">
                  <select
                    className={`${inputClass} cursor-pointer`}
                    value={form.language}
                    onChange={(e) =>
                      update("language", Number(e.target.value))
                    }
                  >
                    {LANGUAGES.map((l) => (
                      <option
                        key={l.value}
                        value={l.value}
                        className="bg-slate-900 text-white"
                      >
                        {l.label}
                      </option>
                    ))}
                  </select>
                </Field>

              </div>
            </div>
          </section>

          {/* TEAM */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-violet-400/30 to-transparent" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
                Équipe
              </span>

              <div className="h-px flex-1 bg-gradient-to-l from-violet-400/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Field
                label="Expérience moyenne de l'équipe"
                hint="Moyenne d'expérience professionnelle des développeurs qui travailleront sur ce projet."
              >
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    className={`${inputClass} pr-20`}
                    value={form.team_exp}
                    onChange={(e) =>
                      update("team_exp", Number(e.target.value))
                    }
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    années
                  </span>
                </div>
              </Field>

              <Field
                label="Expérience en gestion"
                hint="Votre expérience personnelle en tant que chef de projet."
              >
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    className={`${inputClass} pr-20`}
                    value={form.manager_exp}
                    onChange={(e) =>
                      update("manager_exp", Number(e.target.value))
                    }
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    années
                  </span>
                </div>
              </Field>

            </div>
          </section>

          {/* TECHNICAL */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-blue-400/30 to-transparent" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                Taille technique
              </span>

              <div className="h-px flex-1 bg-gradient-to-l from-blue-400/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Field
                label="Nombre de transactions"
                hint="Nombre d'actions utilisateur distinctes prévues : créer, modifier, rechercher, supprimer..."
              >
                <input
                  type="number"
                  min={0}
                  required
                  className={inputClass}
                  value={form.transactions}
                  onChange={(e) =>
                    update("transactions", Number(e.target.value))
                  }
                />
              </Field>

              <Field
                label="Nombre d'entités"
                hint="Nombre de types d'objets métier distincts : Client, Commande, Produit..."
              >
                <input
                  type="number"
                  min={0}
                  required
                  className={inputClass}
                  value={form.entities}
                  onChange={(e) =>
                    update("entities", Number(e.target.value))
                  }
                />
              </Field>

              <Field
                label="Points de fonction"
                hint="Taille brute du projet en points de fonction."
              >
                <input
                  type="number"
                  min={0}
                  required
                  className={inputClass}
                  value={form.points_non_adjust}
                  onChange={(e) =>
                    update(
                      "points_non_adjust",
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

              <Field
                label="Facteur d'ajustement"
                hint="Complexité technique additionnelle : 0.65 simple, 1 standard, 1.35 complexe."
              >
                <input
                  type="number"
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  className={inputClass}
                  value={form.adjustment}
                  onChange={(e) =>
                    update("adjustment", Number(e.target.value))
                  }
                />
              </Field>

            </div>
          </section>

          {/* BUDGET */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-fuchsia-400/30 to-transparent" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">
                Budget & effort
              </span>

              <div className="h-px flex-1 bg-gradient-to-l from-fuchsia-400/30 to-transparent" />
            </div>

            <Field
              label="Budget d'effort prévu"
              hint="Nombre d'heures prévu ou budgété. Nexus le comparera à son estimation IA."
            >
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  required
                  className={`${inputClass} pr-20`}
                  value={form.planned_effort}
                  onChange={(e) =>
                    update("planned_effort", Number(e.target.value))
                  }
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  heures
                </span>
              </div>
            </Field>
          </section>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(34,211,238,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(34,211,238,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Création...
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    Créer le projet
                  </>
                )}
              </span>

              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}