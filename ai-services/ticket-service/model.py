"""Entraînement et prédiction : un classifieur TF-IDF + régression logistique par cible."""
import json
from datetime import datetime, timezone
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import FeatureUnion, Pipeline

from dataset import CATEGORIES, SENTIMENTS, URGENCIES

TARGETS = {"category": CATEGORIES, "urgency": URGENCIES, "sentiment": SENTIMENTS}
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "ticket_triage.joblib"
EVAL_PATH = BASE_DIR / "eval_tickets.json"
FEEDBACK_WEIGHT = 3  # une correction d'agent compte plus qu'un exemple générique


def text_of(row: dict) -> str:
    return f"{row.get('title', '')}. {row.get('description', '')}".lower()


def build_pipeline() -> Pipeline:
    # Les n-grammes de caractères gèrent fautes de frappe, accents et arabe ;
    # les n-grammes de mots captent les expressions (« ne fonctionne pas », « production is down »).
    features = FeatureUnion([
        ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True, max_features=60000)),
        ("words", TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=1, sublinear_tf=True, token_pattern=r"(?u)\b\w+\b")),
    ])
    return Pipeline([
        ("features", features),
        ("clf", LogisticRegression(C=4.0, max_iter=3000, class_weight="balanced", solver="liblinear")),
    ])


def _labelled(rows: list[dict], target: str) -> list[dict]:
    return [r for r in rows if r.get(target) in TARGETS[target]]


def _fit(rows: list[dict], target: str) -> Pipeline:
    model = build_pipeline()
    model.fit([text_of(r) for r in rows], [r[target] for r in rows])
    return model


def evaluate(models: dict, rows: list[dict]) -> dict:
    out = {}
    for target, model in models.items():
        data = _labelled(rows, target)
        if not data:
            continue
        y_true = [r[target] for r in data]
        y_pred = model.predict([text_of(r) for r in data])
        out[target] = {
            "accuracy": round(float(accuracy_score(y_true, y_pred)), 3),
            "f1_macro": round(float(f1_score(y_true, y_pred, average="macro")), 3),
            "n": len(data),
        }
    return out


def train(base_rows: list[dict], feedback: list[dict] | None = None) -> dict:
    feedback = feedback or []
    models, holdout = {}, {}

    for target in TARGETS:
        data = _labelled(base_rows, target)
        fb = _labelled(feedback, target) * FEEDBACK_WEIGHT

        # Découpage par formulation : le test ne contient que des problèmes jamais vus à l'entraînement
        groups = [r.get("group") or text_of(r) for r in data]
        train_idx, test_idx = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42).split(data, groups=groups))
        holdout[target] = evaluate({target: _fit([data[i] for i in train_idx], target)}, [data[i] for i in test_idx])[target]

        # Le modèle livré apprend sur toutes les données + les corrections des agents
        models[target] = _fit(data + fb, target)

    eval_rows = json.loads(EVAL_PATH.read_text(encoding="utf-8")) if EVAL_PATH.exists() else []

    return {
        "models": models,
        "version": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(base_rows),
        "n_feedback": len(feedback),
        "sources": sorted({r.get("source", "generated") for r in base_rows}),
        "metrics": {
            "holdout": holdout,
            # Tickets rédigés à la main, jamais vus à l'entraînement : mesure la généralisation
            "handwritten": evaluate(models, eval_rows),
        },
    }


def predict(bundle: dict, title: str, description: str) -> dict:
    text = text_of({"title": title, "description": description})
    result, confidence = {}, {}
    for target, model in bundle["models"].items():
        proba = model.predict_proba([text])[0]
        best = int(proba.argmax())
        result[target] = str(model.classes_[best])
        confidence[target] = round(float(proba[best]), 3)
    return {**result, "confidence": confidence}
