// src/components/chef/RiskPredictionTester.tsx
import { useState } from "react";
import axios from "axios";
import { api } from "../../lib/api";

type PredictionResult = {
  predicted_effort_hours: number;
  risk_level: string;
  [key: string]: unknown;
};

type FormState = {
  team_exp: string;
  manager_exp: string;
  length: string;
  transactions: string;
  entities: string;
  points_non_adjust: string;
  adjustment: string;
  language: string;
  planned_effort: string;
};

const INITIAL_STATE: FormState = {
  team_exp: "",
  manager_exp: "",
  length: "",
  transactions: "",
  entities: "",
  points_non_adjust: "",
  adjustment: "1",
  language: "",
  planned_effort: "",
};

const FIELDS: { key: keyof FormState; label: string; step?: string }[] = [
  { key: "team_exp", label: "Expérience équipe (années)" },
  { key: "manager_exp", label: "Expérience chef de projet (années)" },
  { key: "length", label: "Durée du projet (mois)" },
  { key: "transactions", label: "Nombre de transactions" },
  { key: "entities", label: "Nombre d'entités" },
  { key: "points_non_adjust", label: "Points de fonction bruts" },
  { key: "adjustment", label: "Facteur d'ajustement", step: "0.05" },
  { key: "language", label: "Langage (code numérique)" },
  { key: "planned_effort", label: "Effort planifié (heures)" },
];

function getRiskClass(level: string | null): string {
  switch (level) {
    case "Faible":
      return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
    case "Modéré":
    case "Modérée":
      return "text-cyan-300 bg-cyan-400/10 border-cyan-400/20";
    case "Moyen":
      return "text-amber-300 bg-amber-400/10 border-amber-400/20";
    case "Élevé":
      return "text-orange-300 bg-orange-400/10 border-orange-400/20";
    case "Critique":
      return "text-rose-300 bg-rose-400/10 border-rose-400/20";
    default:
      return "text-slate-300 bg-white/[0.04] border-white/[0.08]";
  }
}

export default function RiskPredictionTester() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, Number(value)])
      );

      const response = await api.post("/risk-predictions/test", payload);
      setResult(response.data.prediction as PredictionResult);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Impossible de tester le modèle pour le moment."
        );
      } else {
        setError("Impossible de tester le modèle pour le moment.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0B1628]/80 p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
          NEXUS AI
        </span>
        <span className="text-slate-700">/</span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
          Model Playground
        </span>
      </div>

      <h2 className="mb-1 text-lg font-semibold text-white">
        Tester le modèle de prédiction de risque
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        Envoie des paramètres arbitraires au modèle sans créer de projet.
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-xs text-slate-400">
              {field.label}
            </label>
            <input
              type="number"
              step={field.step ?? "1"}
              required
              value={form[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:bg-white/[0.05]"
            />
          </div>
        ))}

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyse en cours…" : "Lancer la prédiction"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] px-5 py-4 text-sm text-rose-200/80">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Effort prédit
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-cyan-300">
              {result.predicted_effort_hours}
              <span className="ml-1 text-xs font-normal text-slate-500">h</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Niveau de risque
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${getRiskClass(
                result.risk_level
              )}`}
            >
              {result.risk_level}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}