import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="NEXUS AI - Project Risk Prediction Service")

# Autorise le backend Laravel (local + production) à appeler ce service.
# Ajuste les origines si besoin (ex: ton URL Render du backend).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à restreindre en production si souhaité
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "project_risk_model.pkl"
FEATURE_ORDER_PATH = MODEL_DIR / "feature_order.json"

model = joblib.load(MODEL_PATH)
with open(FEATURE_ORDER_PATH) as f:
    FEATURE_ORDER = json.load(f)


class ProjectInput(BaseModel):
    team_exp: float
    manager_exp: float
    length: float
    transactions: float
    entities: float
    points_non_adjust: float
    adjustment: float
    language: int
    planned_effort: float  # budget saisi par le chef de projet, pour comparaison


def build_features(data: ProjectInput) -> pd.DataFrame:
    """Reconstruit exactement les mêmes features que celles utilisées à l'entraînement
    (Cellule A du notebook Kaggle), dans l'ordre attendu par le modèle."""

    team_exp = data.team_exp
    manager_exp = data.manager_exp
    transactions = data.transactions
    entities = data.entities
    points_non_adjust = data.points_non_adjust
    adjustment = data.adjustment

    density = points_non_adjust / (transactions + entities + 1)
    exp_weighted_complexity = points_non_adjust / (team_exp + manager_exp + 1)
    vaf = 0.65 + 0.01 * adjustment
    points_adjusted_calc = points_non_adjust * vaf

    raw = {
        "TeamExp": team_exp,
        "ManagerExp": manager_exp,
        "Length": data.length,
        "Transactions": transactions,
        "Entities": entities,
        "PointsNonAdjust": points_non_adjust,
        "Adjustment": adjustment,
        "Language": data.language,
        "Density": density,
        "ExpWeightedComplexity": exp_weighted_complexity,
        "VAF": vaf,
        "PointsAdjustedCalc": points_adjusted_calc,
    }

    # Réordonne strictement selon feature_order.json — indispensable,
    # le modèle est sensible à l'ordre des colonnes.
    ordered = {col: raw[col] for col in FEATURE_ORDER}
    return pd.DataFrame([ordered])


def risk_level_from_gap(predicted_effort: float, planned_effort: float) -> tuple[str, float]:
    """Calcule un niveau de risque catégoriel à partir de l'écart relatif
    entre l'effort prédit par le modèle et le budget saisi par le chef de projet."""

    if planned_effort <= 0:
        return "Indéterminé", 0.0

    gap_ratio = (predicted_effort - planned_effort) / planned_effort

    if gap_ratio <= 0.10:
        level = "Faible"
    elif gap_ratio <= 0.35:
        level = "Modéré"
    else:
        level = "Élevé"

    return level, round(gap_ratio * 100, 1)


FEATURE_LABELS = {
    "TeamExp": "Expérience de l'équipe",
    "ManagerExp": "Expérience du chef de projet",
    "Length": "Durée du projet",
    "Transactions": "Nombre de transactions",
    "Entities": "Nombre d'entités",
    "PointsNonAdjust": "Points de fonction bruts",
    "Adjustment": "Facteur d'ajustement technique",
    "Language": "Langage / technologie",
    "Density": "Densité fonctionnelle",
    "ExpWeightedComplexity": "Complexité pondérée par l'expérience",
    "VAF": "Facteur d'ajustement (VAF)",
    "PointsAdjustedCalc": "Points de fonction ajustés",
}

# Variables saisies par l'utilisateur que l'on fait varier pour expliquer la prédiction
# (champ de ProjectInput, nom de colonne du modèle). "language" est un code
# catégoriel : le faire varier de ±20 % n'a aucun sens, il est donc exclu.
SENSITIVITY_FIELDS = [
    ("team_exp", "TeamExp"),
    ("manager_exp", "ManagerExp"),
    ("length", "Length"),
    ("transactions", "Transactions"),
    ("entities", "Entities"),
    ("points_non_adjust", "PointsNonAdjust"),
    ("adjustment", "Adjustment"),
]

SENSITIVITY_STEP = 0.20  # ±20 %


def classify_behavior(delta_minus: float, delta_plus: float, base: float) -> str:
    """Décrit comment l'effort réagit quand la variable augmente.

    Un modèle à base d'arbres n'est pas forcément monotone : on ne peut donc pas
    affirmer « plus de X = plus d'effort » sans le vérifier sur ce projet.
    """
    tol = max(1.0, abs(base) * 0.01)  # < 1 % de l'effort prédit = négligeable
    if abs(delta_minus) < tol and abs(delta_plus) < tol:
        return "négligeable"
    if delta_plus > tol and delta_minus < -tol:
        return "croissant"      # variable ↑ => effort ↑
    if delta_plus < -tol and delta_minus > tol:
        return "décroissant"    # variable ↑ => effort ↓
    return "non linéaire"       # réponse irrégulière autour de la valeur saisie


def build_explanation(data: ProjectInput, base_effort: float) -> dict:
    """Explique la prédiction de deux façons complémentaires :

    1. Sensibilité locale : pour CE projet, on refait la prédiction en faisant
       varier chaque variable de ±20 % (les autres restent identiques) et on
       mesure l'écart d'effort en heures.
    2. Importance globale : poids de chaque variable dans le modèle entraîné.
    """

    rows, meta = [], []
    for field, column in SENSITIVITY_FIELDS:
        value = float(getattr(data, field))
        if value == 0:
            continue  # ±20 % de 0 = 0 : aucune information
        for sign in (-1, 1):
            varied = data.model_copy(
                update={field: value * (1 + sign * SENSITIVITY_STEP)}
            )
            rows.append(build_features(varied))
            meta.append((field, column, value, sign))

    sensitivity = []
    if rows:
        preds = np.expm1(model.predict(pd.concat(rows, ignore_index=True)))
        by_field: dict = {}
        for (field, column, value, sign), pred in zip(meta, preds):
            entry = by_field.setdefault(
                field,
                {
                    "feature": field,
                    "label": FEATURE_LABELS[column],
                    "value": round(value, 2),
                },
            )
            key = "minus_20" if sign < 0 else "plus_20"
            entry[f"effort_if_{key}"] = round(float(pred), 1)
            entry[f"delta_{key}"] = round(float(pred) - base_effort, 1)

        for entry in by_field.values():
            entry["impact_hours"] = round(
                max(
                    abs(entry.get("delta_minus_20", 0.0)),
                    abs(entry.get("delta_plus_20", 0.0)),
                ),
                1,
            )
            entry["behavior"] = classify_behavior(
                entry.get("delta_minus_20", 0.0),
                entry.get("delta_plus_20", 0.0),
                base_effort,
            )
            sensitivity.append(entry)

        sensitivity.sort(key=lambda e: e["impact_hours"], reverse=True)

    importances = getattr(model, "feature_importances_", None)
    global_importance = []
    if importances is not None:
        ranked = sorted(
            zip(FEATURE_ORDER, importances), key=lambda x: x[1], reverse=True
        )
        global_importance = [
            {
                "feature": name,
                "label": FEATURE_LABELS.get(name, name),
                "importance": round(float(weight), 3),
            }
            for name, weight in ranked[:6]
        ]

    return {
        "method": (
            "Sensibilité locale : l'effort est recalculé en faisant varier chaque "
            "variable de ±20 % (les autres restant fixes). Importance globale : "
            "poids des variables dans le modèle entraîné (GradientBoosting)."
        ),
        "sensitivity": sensitivity,
        "global_importance": global_importance,
        "thresholds": {
            "Faible": "écart prédit/planifié ≤ 10 %",
            "Modéré": "10 % < écart ≤ 35 %",
            "Élevé": "écart > 35 %",
        },
        "limits": (
            "Estimation ponctuelle sans intervalle de confiance. Le langage "
            "(variable catégorielle) n'est pas inclus dans l'analyse de sensibilité. "
            "La sensibilité est locale : elle décrit ce projet, pas une règle générale."
        ),
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict-risk")
def predict_risk(data: ProjectInput):
    try:
        X = build_features(data)
        pred_log = model.predict(X)[0]
        predicted_effort = float(np.expm1(pred_log))

        risk_level, gap_percent = risk_level_from_gap(
            predicted_effort,
            data.planned_effort
        )

        # L'explication ne doit jamais empêcher la prédiction de sortir.
        try:
            explanation = build_explanation(data, predicted_effort)
        except Exception:
            explanation = None

        return {
            "predicted_effort_hours": round(predicted_effort, 1),
            "planned_effort_hours": data.planned_effort,
            "gap_percent": gap_percent,
            "risk_level": risk_level,
            "explanation": explanation,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de prédiction: {str(e)}"
        )


if __name__ == "__main__":
    import os
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8001)),
    )