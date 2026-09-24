// Types partagés : résultat du modèle de risque + bilan explicable (Groq)

export type RiskBehavior =
  | "croissant"
  | "décroissant"
  | "non linéaire"
  | "négligeable";

export type RiskSensitivityItem = {
  feature: string;
  label: string;
  value: number;
  effort_if_minus_20?: number;
  effort_if_plus_20?: number;
  delta_minus_20?: number;
  delta_plus_20?: number;
  impact_hours: number;
  behavior?: RiskBehavior;
};

export type RiskGlobalImportance = {
  feature: string;
  label: string;
  importance: number;
};

export type RiskExplanationData = {
  method?: string;
  sensitivity: RiskSensitivityItem[];
  global_importance: RiskGlobalImportance[];
  thresholds?: Record<string, string>;
  limits?: string;
};

export type KeyFactor = {
  factor: string;
  influence: string;
  explanation: string;
};

export type AIReportData = {
  summary: string;
  health: "Bonne" | "Moyenne" | "Préoccupante" | "Critique";
  strengths: string[];
  risks: {
    title: string;
    description: string;
    severity: "Faible" | "Modérée" | "Élevée" | "Critique";
  }[];
  recommendations: string[];
  effort_analysis: string;
  final_verdict: string;

  // Explicabilité (absent des bilans générés avant cette fonctionnalité)
  model_explanation?: string;
  key_factors?: KeyFactor[];
  confidence_note?: string;
};
