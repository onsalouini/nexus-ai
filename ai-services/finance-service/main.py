from pathlib import Path
import os

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "financial_health_model.pkl"


# ============================================================
# CHARGEMENT DU BUNDLE
# ============================================================

bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
features = bundle["features"]
explainer = bundle["explainer"]
decision_threshold = bundle["decision_threshold"]
metrics = bundle["metrics"]


# ============================================================
# APPLICATION FASTAPI
# ============================================================

app = FastAPI(
    title="Anypli Finance Service",
    description="Service de prédiction de santé financière",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SCHEMA DE REQUÊTE
# ============================================================

class FinancialData(BaseModel):
    current_ratio: float
    cash_total_assets: float
    roa_before_interest_depreciation: float
    operating_profit_rate: float
    debt_ratio: float
    net_worth_assets: float
    working_capital_total_assets: float
    net_income_total_assets: float
    total_asset_turnover: float
    retained_earnings_total_assets: float
    interest_coverage_ratio: float
    equity_liability: float
    cash_flow_total_assets: float


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "service": "finance-service",
        "status": "ok",
        "model_loaded": True,
        "features_count": len(features),
        "decision_threshold": decision_threshold,
    }


# ============================================================
# INFORMATIONS DU MODÈLE
# ============================================================

@app.get("/model-info")
def model_info():
    return {
        "features": features,
        "decision_threshold": decision_threshold,
        "metrics": metrics,
        "model_type": type(model).__name__,
        "explainer_type": type(explainer).__name__,
    }


# ============================================================
# CONSTRUCTION DES FEATURES
# ============================================================

def build_input_data(data: FinancialData) -> pd.DataFrame:

    values = {
        "Current Ratio": data.current_ratio,
        "Cash/Total Assets": data.cash_total_assets,
        "ROA(C) before interest and depreciation before interest": (
            data.roa_before_interest_depreciation
        ),
        "Operating Profit Rate": data.operating_profit_rate,
        "Debt ratio %": data.debt_ratio,
        "Net worth/Assets": data.net_worth_assets,
        "Working Capital to Total Assets": (
            data.working_capital_total_assets
        ),
        "Net Income to Total Assets": data.net_income_total_assets,
        "Total Asset Turnover": data.total_asset_turnover,
        "Retained Earnings to Total Assets": (
            data.retained_earnings_total_assets
        ),
        "Interest Coverage Ratio (Interest expense to EBIT)": (
            data.interest_coverage_ratio
        ),
        "Equity to Liability": data.equity_liability,
        "Cash Flow to Total Assets": data.cash_flow_total_assets,
    }

    return pd.DataFrame(
        [[values[feature.strip()] for feature in features]],
        columns=features,
    )


# ============================================================
# PRÉDICTION
# ============================================================

@app.post("/predict")
def predict(data: FinancialData):

    try:
        print("\n========== PREDICTION ==========")

        input_data = build_input_data(data)

        print("Features du modèle :", features)
        print("Features envoyées :", list(input_data.columns))
        print("Input :")
        print(input_data)

        print("Type du modèle :", type(model))
        print("Appel de model.predict_proba()...")

        probabilities = model.predict_proba(input_data)[0]

        print("Probabilités :", probabilities)

        bankruptcy_probability = float(probabilities[1])

        prediction = int(
            bankruptcy_probability >= decision_threshold
        )

        print("Résultat :", prediction)
        print("================================\n")

        return {
            "prediction": prediction,
            "financial_health": (
                "at_risk" if prediction == 1 else "healthy"
            ),
            "bankruptcy_probability": bankruptcy_probability,
            "decision_threshold": decision_threshold,
        }

    except Exception as e:
        import traceback

        print("\n========== ERREUR PREDICTION ==========")
        traceback.print_exc()
        print("========================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {type(e).__name__}: {str(e)}",
        )
    # ============================================================
# EXPLICATION SHAP
# ============================================================

@app.post("/explain")
def explain(data: FinancialData):

    try:
        print("\n========== EXPLICATION SHAP ==========")

        input_data = build_input_data(data)

        print("Calcul des SHAP values...")
        shap_values = explainer.shap_values(input_data)

        if isinstance(shap_values, list):
            values_array = shap_values[-1][0]
        else:
            values_array = shap_values[0]

        explanation = []

        for feature, value in zip(features, values_array):
            explanation.append(
                {
                    "feature": feature.strip(),
                    "shap_value": float(value),
                    "impact": (
                        "increases_risk"
                        if value > 0
                        else "decreases_risk"
                    ),
                }
            )

        explanation.sort(
            key=lambda x: abs(x["shap_value"]),
            reverse=True,
        )

        print("Explication SHAP générée.")
        print("====================================\n")

        return {
            "explanations": explanation
        }

    except Exception as e:
        import traceback

        print("\n========== ERREUR SHAP ==========")
        traceback.print_exc()
        print("=================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"SHAP explanation error: {type(e).__name__}: {str(e)}",
        )

# ============================================================
# LANCEMENT LOCAL
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8002)),
    )