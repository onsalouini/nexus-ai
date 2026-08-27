import joblib

path = "model/financial_health_model.pkl"

bundle = joblib.load(path)

print("\n=== TYPE DU BUNDLE ===")
print(type(bundle))

print("\n=== FEATURES ===")
for i, feature in enumerate(bundle["features"], start=1):
    print(f"{i}. {feature}")

print("\n=== DECISION THRESHOLD ===")
print(bundle["decision_threshold"])

print("\n=== METRICS ===")
for key, value in bundle["metrics"].items():
    print(f"{key}: {value}")

print("\n=== MODEL ===")
print(type(bundle["model"]))

print("\n=== EXPLAINER ===")
print(type(bundle["explainer"]))