// Explication du modèle de risque : lecture Groq + preuves chiffrées du modèle
import { useTranslation } from "react-i18next";
import type {
  AIReportData,
  RiskExplanationData,
  RiskSensitivityItem,
} from "../../types/projectRisk";
import i18n from "../../i18n";

type Props = {
  explanation?: RiskExplanationData | null;
  report?: Pick<
    AIReportData,
    "model_explanation" | "key_factors" | "confidence_note"
  > | null;
};

const INFLUENCE_STYLE: Record<string, string> = {
  "Augmente l'effort": "text-rose-300 bg-rose-400/10 border-rose-400/20",
  "Réduit l'effort": "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  "Impact irrégulier": "text-amber-300 bg-amber-400/10 border-amber-400/20",
  "Impact faible": "text-slate-300 bg-white/[0.04] border-white/[0.08]",
};

// Valeurs renvoyées par le service IA -> clés de traduction
const BEHAVIOR_KEY: Record<string, string> = {
  croissant: "increasing",
  décroissant: "decreasing",
  "non linéaire": "nonLinear",
  négligeable: "negligible",
};

const INFLUENCE_KEY: Record<string, string> = {
  "Augmente l'effort": "increases",
  "Réduit l'effort": "reduces",
  "Impact irrégulier": "irregular",
  "Impact faible": "low",
};

// Libellé de variable traduit à partir de sa clé technique (TeamExp, Length...)
function featureLabel(feature: string, fallback: string): string {
  return i18n.t(`chef.models.features.${feature}.label`, { defaultValue: fallback });
}

function signed(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded} ${i18n.t("common.hoursShort")}`;
}

function SectionTitle({
  children,
  accent = "bg-cyan-400/60",
}: {
  children: string;
  accent?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={`h-px w-5 ${accent}`} />
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {children}
      </h3>
    </div>
  );
}

function SensitivityRow({
  item,
  scale,
}: {
  item: RiskSensitivityItem;
  scale: number;
}) {
  const { t } = useTranslation();
  const minus = item.delta_minus_20 ?? 0;
  const plus = item.delta_plus_20 ?? 0;

  // barre divergente : négatif à gauche du centre, positif à droite
  const bar = (delta: number, color: string) => (
    <div className="relative h-2 w-full rounded-full bg-white/[0.04]">
      <span className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
      <span
        className={`absolute top-0 h-full rounded-full ${color}`}
        style={{
          width: `${Math.min(50, (Math.abs(delta) / scale) * 50)}%`,
          ...(delta >= 0 ? { insetInlineStart: "50%" } : { insetInlineEnd: "50%" }),
        }}
      />
    </div>
  );

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3.5">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">
          {featureLabel(item.feature, item.label)}
          <span className="ms-2 text-xs font-normal text-slate-500">
            {t("risk.explanation.enteredValue", { value: item.value })}
          </span>
        </p>

        {item.behavior && (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-slate-400">
            {BEHAVIOR_KEY[item.behavior] ? t(`risk.explanation.behavior.${BEHAVIOR_KEY[item.behavior]}`) : item.behavior}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-[10px] text-slate-500">−20 %</span>
          {bar(minus, "bg-violet-400/70")}
          <span className="w-16 shrink-0 text-end text-xs tabular-nums text-slate-300">
            {signed(minus)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-[10px] text-slate-500">+20 %</span>
          {bar(plus, "bg-cyan-400/70")}
          <span className="w-16 shrink-0 text-end text-xs tabular-nums text-slate-300">
            {signed(plus)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RiskExplanation({ explanation, report }: Props) {
  const { t } = useTranslation();
  const sensitivity = explanation?.sensitivity ?? [];
  const importance = explanation?.global_importance ?? [];
  const factors = report?.key_factors ?? [];

  const hasContent =
    Boolean(report?.model_explanation) ||
    factors.length > 0 ||
    sensitivity.length > 0;

  if (!hasContent) return null;

  const scale = Math.max(
    1,
    ...sensitivity.flatMap((s) => [
      Math.abs(s.delta_minus_20 ?? 0),
      Math.abs(s.delta_plus_20 ?? 0),
    ])
  );

  const maxImportance = Math.max(0.001, ...importance.map((g) => g.importance));

  return (
    <div className="space-y-8">
      {/* LECTURE GROQ */}
      {report?.model_explanation && (
        <section>
          <SectionTitle accent="bg-violet-400/60">
            {t("risk.explanation.why")}
          </SectionTitle>

          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            {report.model_explanation}
          </p>
        </section>
      )}

      {factors.length > 0 && (
        <section>
          <SectionTitle>{t("risk.explanation.keyFactors")}</SectionTitle>

          <div className="grid gap-3 md:grid-cols-2">
            {factors.map((f, i) => (
              <div
                key={`${f.factor}-${i}`}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{f.factor}</p>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                      INFLUENCE_STYLE[f.influence] ?? INFLUENCE_STYLE["Impact faible"]
                    }`}
                  >
                    {INFLUENCE_KEY[f.influence] ? t(`risk.explanation.influence.${INFLUENCE_KEY[f.influence]}`) : f.influence}
                  </span>
                </div>

                <p className="text-xs leading-6 text-slate-400">
                  {f.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PREUVES CHIFFRÉES DU MODÈLE */}
      {sensitivity.length > 0 && (
        <section>
          <SectionTitle accent="bg-blue-400/60">
            {t("risk.explanation.sensitivity")}
          </SectionTitle>

          <p className="mb-4 max-w-3xl text-xs leading-6 text-slate-500">
            {t("risk.explanation.sensitivityHint")}
          </p>

          <div className="space-y-2.5">
            {sensitivity.map((item) => (
              <SensitivityRow key={item.feature} item={item} scale={scale} />
            ))}
          </div>
        </section>
      )}

      {importance.length > 0 && (
        <section>
          <SectionTitle accent="bg-fuchsia-400/60">
            {t("risk.explanation.importance")}
          </SectionTitle>

          <div className="space-y-2">
            {importance.map((g) => (
              <div key={g.feature} className="flex items-center gap-3">
                <span className="w-56 shrink-0 truncate text-xs text-slate-400">
                  {featureLabel(g.feature, g.label)}
                </span>

                <div className="h-2 flex-1 rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 to-violet-400/70"
                    style={{ width: `${(g.importance / maxImportance) * 100}%` }}
                  />
                </div>

                <span className="w-12 shrink-0 text-end text-xs tabular-nums text-slate-500">
                  {(g.importance * 100).toFixed(0)} %
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LIMITES */}
      {(report?.confidence_note || explanation?.limits) && (
        <section className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] px-5 py-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            {t("risk.explanation.limits")}
          </p>

          <p className="text-xs leading-6 text-slate-400">
            {report?.confidence_note || explanation?.limits}
          </p>
        </section>
      )}
    </div>
  );
}
