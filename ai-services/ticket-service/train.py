"""
Entraîne le modèle de tri des tickets et l'enregistre dans model/ticket_triage.joblib.

    python train.py                         # corpus généré FR/EN/AR
    python train.py --kaggle tickets.csv    # + dataset Kaggle « Customer Support Ticket Dataset »
"""
import argparse
import json

import joblib

from dataset import generate, load_kaggle
from model import MODEL_PATH, train


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kaggle", help="CSV du dataset Kaggle Customer Support Ticket")
    parser.add_argument("--samples", type=int, default=6000, help="Nombre d'exemples générés")
    args = parser.parse_args()

    rows = generate(args.samples)
    if args.kaggle:
        kaggle = load_kaggle(args.kaggle)
        print(f"Kaggle : {len(kaggle)} tickets ajoutés")
        rows += kaggle

    bundle = train(rows)
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(bundle, MODEL_PATH, compress=3)

    print(f"Modèle enregistré : {MODEL_PATH} (version {bundle['version']}, {bundle['n_samples']} exemples)")
    print(json.dumps(bundle["metrics"], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
