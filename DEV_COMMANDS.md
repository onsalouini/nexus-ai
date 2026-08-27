Environnement Python IA

Environnement virtuel commun :

C:\Users\Lenovo\Desktop\Anypli\nexus-ai\ai-services\venv

Activer :

cd C:\Users\Lenovo\Desktop\Anypli\nexus-ai\ai-services
.\venv\Scripts\Activate.ps1



(venv)
ai-services\models\project_risk_model.pkl

Ordre des features :

ai-services\models\feature_order.json
Lancer
cd C:\Users\Lenovo\Desktop\Anypli\nexus-ai\ai-services
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8001

API :
cd C:\Users\Lenovo\Desktop\Anypli\nexus-ai\ai-services\finance-service
..\venv\Scripts\Activate.ps1
Lancer le service

Le port Finance est :

8002

Commande :

python -m uvicorn main:app --host 127.0.0.1 --port 8002
cd nexus-ai\frontend cd nexus-ai\backend-laravel