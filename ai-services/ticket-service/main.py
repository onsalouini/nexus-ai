"""
NEXUS AI - Service de tri des tickets support (port 8003).

  GET  /health        état du modèle (version, métriques)
  POST /predict       {title, description} -> catégorie, urgence, sentiment + confiance
  POST /train         ré-entraîne avec les corrections des agents (boucle de feedback)
"""
import os
import threading

import joblib
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from dataset import generate
from model import MODEL_PATH, predict, train

app = FastAPI(title="NEXUS AI - Ticket Triage Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Jeton partagé avec Laravel pour protéger /train (optionnel en local)
TOKEN = os.getenv("TICKET_AI_TOKEN")
_lock = threading.Lock()


def _load() -> dict:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    # Premier démarrage (ex. déploiement sans le fichier) : entraînement à la volée
    bundle = train(generate())
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(bundle, MODEL_PATH, compress=3)
    return bundle


bundle = _load()


class TicketIn(BaseModel):
    title: str = Field(default="", max_length=300)
    description: str = Field(default="", max_length=6000)


class Sample(TicketIn):
    category: str | None = None
    urgency: str | None = None
    sentiment: str | None = None


class TrainIn(BaseModel):
    samples: list[Sample] = Field(default_factory=list, max_length=20000)


def _info(b: dict) -> dict:
    return {key: b[key] for key in ("version", "trained_at", "n_samples", "n_feedback", "sources", "metrics")}


@app.get("/health")
def health():
    return {"status": "ok", "model": _info(bundle)}


@app.post("/predict")
def predict_ticket(ticket: TicketIn):
    if not (ticket.title.strip() or ticket.description.strip()):
        raise HTTPException(422, "title or description required")
    return {**predict(bundle, ticket.title, ticket.description), "model_version": bundle["version"]}


@app.post("/train")
def retrain(payload: TrainIn, authorization: str | None = Header(default=None)):
    global bundle
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(401, "invalid token")

    with _lock:
        new_bundle = train(generate(), [s.model_dump() for s in payload.samples])
        joblib.dump(new_bundle, MODEL_PATH, compress=3)
        bundle = new_bundle

    return {"status": "trained", "model": _info(bundle)}
