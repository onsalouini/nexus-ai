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
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {hint && (
          <span className="group relative">
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-400 dark:bg-gray-800">
              ?
            </span>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
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
  "h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#2E9BE6] dark:border-gray-700 dark:bg-transparent dark:text-white";

export default function CreateProjectModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
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
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message ?? "Impossible de créer le projet.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-xl dark:bg-gray-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Nouveau projet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="mb-6 text-sm text-gray-500">
          Ces informations alimentent le modèle IA de prédiction de risque — plus elles sont précises, plus l'estimation sera fiable.
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Infos générales */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#2E9BE6]">Informations générales</span>
            <Field label="Nom du projet">
              <input required className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2E9BE6] dark:border-gray-700 dark:bg-transparent dark:text-white"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Durée prévue (mois)">
                <input type="number" min={1} required className={inputClass} value={form.length}
                  onChange={(e) => update("length", Number(e.target.value))} />
              </Field>
              <Field label="Technologie principale">
                <select className={inputClass} value={form.language} onChange={(e) => update("language", Number(e.target.value))}>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Equipe */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#16B378]">Équipe</span>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expérience moyenne de l'équipe (années)" hint="Moyenne d'expérience professionnelle des développeurs qui travailleront sur ce projet.">
                <input type="number" min={0} step={0.5} required className={inputClass} value={form.team_exp}
                  onChange={(e) => update("team_exp", Number(e.target.value))} />
              </Field>
              <Field label="Votre expérience en gestion (années)" hint="Votre expérience personnelle en tant que chef de projet.">
                <input type="number" min={0} step={0.5} required className={inputClass} value={form.manager_exp}
                  onChange={(e) => update("manager_exp", Number(e.target.value))} />
              </Field>
            </div>
          </div>

          {/* Taille technique */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#F2497A]">Taille technique</span>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre de transactions" hint="Nombre d'actions utilisateur distinctes prévues (ex : créer, modifier, rechercher, supprimer).">
                <input type="number" min={0} required className={inputClass} value={form.transactions}
                  onChange={(e) => update("transactions", Number(e.target.value))} />
              </Field>
              <Field label="Nombre d'entités" hint="Nombre de types d'objets métier distincts (ex : Client, Commande, Produit).">
                <input type="number" min={0} required className={inputClass} value={form.entities}
                  onChange={(e) => update("entities", Number(e.target.value))} />
              </Field>
              <Field label="Points de fonction" hint="Taille brute du projet en points de fonction — indicateur standard de complexité logicielle.">
                <input type="number" min={0} required className={inputClass} value={form.points_non_adjust}
                  onChange={(e) => update("points_non_adjust", Number(e.target.value))} />
              </Field>
              <Field label="Facteur d'ajustement" hint="Complexité technique additionnelle (0.65 = simple, 1 = standard, 1.35 = complexe).">
                <input type="number" min={0.5} max={1.5} step={0.05} className={inputClass} value={form.adjustment}
                  onChange={(e) => update("adjustment", Number(e.target.value))} />
              </Field>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-500">Budget</span>
            <Field label="Budget d'effort prévu (heures)" hint="Le nombre d'heures que vous avez prévu/budgété pour ce projet — c'est ce que l'IA comparera à son estimation.">
              <input type="number" min={1} required className={inputClass} value={form.planned_effort}
                onChange={(e) => update("planned_effort", Number(e.target.value))} />
            </Field>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-gradient-to-r dark:from-[#16B378] dark:to-[#2E9BE6]">
            {loading ? "Création..." : "Créer le projet"}
          </button>
        </form>
      </div>
    </div>
  );
}