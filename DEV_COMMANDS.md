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
Service de tri des tickets (modèle ML : catégorie, urgence, sentiment) — port 8003 :

cd C:\Users\Lenovo\Desktop\Anypli\nexus-ai\ai-services\ticket-service
..\venv\Scripts\Activate.ps1
python train.py                       (ré-entraîner ; option --kaggle tickets.csv)
python -m uvicorn main:app --host 127.0.0.1 --port 8003

Backend : TICKET_AI_URL=http://127.0.0.1:8003 dans .env (sinon tri par Groq / mots-clés).

Alertes et notifications (retards, risques, faillite) — contrôle planifié toutes les heures :

php artisan schedule:work            (ou une seule fois : php artisan nexus:scan-alerts)
Les mêmes contrôles s'exécutent aussi quand un utilisateur ouvre ses notifications.

Comptes clients de démo : php artisan db:seed --class=ClientDemoSeeder
  client{N}@nexus-demo.tn / Password123!   (ex. client2@nexus-demo.tn)

Déploiement du service de tri des tickets sur Render (fichier render.yaml à la racine) :

1. Render → New → Blueprint → dépôt onsalouini/nexus-ai → Apply : crée « nexus-ticket-ai ».
2. Copier l'URL du service (ex. https://nexus-ticket-ai.onrender.com) et la valeur générée de TICKET_AI_TOKEN.
3. Service backend Laravel → Environment : TICKET_AI_URL=<url>  et  TICKET_AI_TOKEN=<même jeton>.
4. Vérifier : https://nexus-ticket-ai.onrender.com/health  (version + précision du modèle).
Sans ces variables, le tri se fait par Groq puis par mots-clés : rien ne casse.

Messagerie interne : chef ↔ direction, chef ↔ employés, client ↔ chef (menu « Messages » de chaque espace).
Demandes de changement : le client les envoie depuis « Suivi détaillé » ; le chef les traite dans « Demandes clients ».
