import i18n from "./index";

/*
| Le backend et les services IA renvoient des valeurs métier en français
| ("Faible", "Élevé", "Bonne"...). Elles restent les valeurs de référence
| (comparaisons, couleurs) ; ces helpers ne font que traduire l'affichage.
*/

const RISK_KEYS: Record<string, string> = {
  faible: "low",
  low: "low",
  modere: "medium",
  moderee: "medium",
  moyen: "medium",
  moyenne: "medium",
  medium: "medium",
  eleve: "high",
  elevee: "high",
  high: "high",
  critique: "critical",
  critical: "critical",
  indetermine: "unknown",
};

const HEALTH_KEYS: Record<string, string> = {
  bonne: "good",
  moyenne: "average",
  preoccupante: "concerning",
  critique: "critical",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/* Niveau de risque / sévérité : Faible, Modéré(e), Moyen, Élevé(e), Critique */
export function riskLabel(level: string | null | undefined, fallback = "—"): string {
  if (!level) return fallback;
  const key = RISK_KEYS[normalize(level)];
  return key ? i18n.t(`common.riskLevel.${key}`) : level;
}

/* Santé d'un projet : Bonne, Moyenne, Préoccupante, Critique */
export function healthLabel(health: string | null | undefined, fallback = "—"): string {
  if (!health) return fallback;
  const key = HEALTH_KEYS[normalize(health)];
  return key ? i18n.t(`common.health.${key}`) : health;
}

/* Rôle utilisateur */
export function roleLabel(role: string | null | undefined): string {
  if (!role) return i18n.t("common.roles.employee");
  return i18n.t(`common.roles.${role}`, { defaultValue: role });
}
