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


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict-risk")
def predict_risk(data: ProjectInput):
    try:
        X = build_features(data)
        pred_log = model.predict(X)[0]
        predicted_effort = float(np.expm1(pred_log))

        risk_level, gap_percent = risk_level_from_gap(predicted_effort, data.planned_effort)

        return {
            "predicted_effort_hours": round(predicted_effort, 1),
            "planned_effort_hours": data.planned_effort,
            "gap_percent": gap_percent,
            "risk_level": risk_level,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de prédiction: {str(e)}")