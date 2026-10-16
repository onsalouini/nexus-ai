# NEXUS AI — Scénario de démonstration « from scratch »

Durée : 30 à 40 min. Toutes les valeurs ci-dessous ont été testées sur les vrais modèles IA :
elles produisent bien les résultats annoncés (risque faible / élevé, entreprise saine / en danger,
tickets triés correctement).

---

## 0. Préparation (la veille)

### 0.1 Emails
Il faut une vraie boîte mail pour recevoir les codes de vérification et les invitations.
Avec Gmail, une seule boîte suffit grâce aux alias `+` (tous les mails arrivent dans la même boîte) :

| Rôle | Email à utiliser | Mot de passe |
|---|---|---|
| Direction | `votre.adresse+direction@gmail.com` | `Demo2026!` |
| Chef de projet | `votre.adresse+chef@gmail.com` | `Demo2026!` |
| Client | `votre.adresse+client@gmail.com` | `Demo2026!` |
| Membre d'équipe | `yassine.demo@nexus-demo.tn` (créé par le chef, pas d'email requis) | mot de passe temporaire affiché |
| Membre d'équipe | `sarra.demo@nexus-demo.tn` (créé par le chef) | mot de passe temporaire affiché |
| Agent support | `amine.demo@nexus-demo.tn` (créé par le chef) | mot de passe temporaire affiché |

> Notez les mots de passe temporaires affichés par la carte « Identifiants » lors de la création des membres.

### 0.2 Navigateurs (une session = un navigateur)
La session est stockée dans le navigateur : on ne peut pas être connecté avec deux comptes dans la même fenêtre.

| Fenêtre | Compte |
|---|---|
| Chrome normal | Direction |
| Chrome navigation privée | Chef de projet |
| Edge | Membre d'équipe puis Agent support |
| Firefox (ou Edge privé) | Client |

### 0.3 Réveiller les services (10 min avant la démo)
Les services Render gratuits s'endorment. Ouvrir une fois :
- le frontend Vercel,
- `https://<backend>.onrender.com/api/invitations/validate/x` (404 = réveillé),
- `https://nexus-ai-ml.onrender.com/health`,
- `https://nexus-finance-ai-cc6c.onrender.com/`,
- `https://nexus-ticket-ai.onrender.com/health`.

L'application réveille aussi ces services à l'ouverture de chaque espace, mais le premier
réveil prend environ 1 minute : mieux vaut le faire avant de commencer.

### 0.4 Application Google Authenticator sur le téléphone (pour la 2FA, acte 10)

---

## Acte 1 — La direction crée l'entreprise (3 min)

**Fenêtre : Chrome normal**

1. Page d'accueil → **Créer un compte**.
2. Étape 1 : Prénom `Ahmed`, Nom `Trabelsi`, Email `…+direction@gmail.com` → recevoir le code.
3. Étape 2 : saisir le code à 6 chiffres reçu par email.
4. Étape 3 : **Photo de profil** → montrer les 2 choix : *Photo* (importer une photo) ou *Initiales* (choisir une couleur). Mot de passe `Demo2026!`.
5. Formulaire entreprise :

| Champ | Valeur |
|---|---|
| Nom | `Jasmin Solutions` |
| Secteur | `Services numériques` |
| Nombre d'employés | `25` |

6. Arrivée sur le tableau de bord Direction.

**À montrer** : bouton langue → **English**, puis **العربية** (toute l'interface passe en arabe, de droite à gauche), revenir en **Français**.

---

## Acte 2 — La direction invite le chef et règle les alertes (2 min)

1. **Invitations** → Prénom `Oussama`, Email `…+chef@gmail.com`, Rôle **Chef de projet**, Langue Français → **Envoyer**.
2. **Paramètres** → section *Alertes et notifications* :
   - Alertes par email : **activées**
   - Notifications du navigateur : **Activer** (accepter la demande du navigateur)
   - Seuils : Risque projet `35 %`, Probabilité de faillite `50 %` → **Enregistrer les seuils**

---

## Acte 3 — Le chef crée ses projets, l'IA prédit le risque (6 min)

**Fenêtre : Chrome privé**

1. Ouvrir l'email d'invitation → **Créer mon compte** → page de bienvenue → formulaire
   (email déjà rempli et verrouillé). Prénom `Oussama`, Nom `Bouazizi`, Téléphone `+216 22 345 678`,
   avatar *Initiales* couleur violette, code email, mot de passe `Demo2026!`.
2. **Nouveau projet** — créer les 3 projets ci-dessous :

| Champ | Projet A : faible risque | Projet B : risque élevé | Projet C : risque modéré |
|---|---|---|---|
| Nom | `Site e-commerce Carthage Shop` | `ERP Logistique TransMed` | `Application RH TalentHub` |
| Description | `Boutique en ligne avec paiement et suivi de commandes` | `ERP complet : stocks, flotte, facturation` | `Gestion des congés et recrutements` |
| Durée prévue (mois) | `6` | `12` | `8` |
| Technologie principale | React / Laravel | Python | React / Laravel |
| Expérience de l'équipe (ans) | `4` | `1` | `2` |
| Expérience en gestion (ans) | `5` | `1` | `3` |
| Nombre de transactions | `120` | `300` | `180` |
| Nombre d'entités | `60` | `150` | `90` |
| Points de fonction | `180` | `450` | `270` |
| Facteur d'ajustement | `1` | `1.2` | `1` |
| Budget d'effort prévu (h) | `2500` | `2500` | `4200` |
| **Résultat attendu** (vérifié sur le modèle en production) | ≈ 2 529 h prédites → **Faible** (+1 %) | ≈ 6 242 h → **Élevé** (+150 %) | ≈ 5 223 h → **Modéré** (+24 %) |

3. **À la création du projet B** :
   - notification **critique** dans la cloche du chef (la cloche bouge),
   - email d'alerte reçu par le chef et la direction,
   - **bandeau rouge « Alertes de risque actives »** sur le tableau de bord (chef et direction).
4. Pour chaque projet → **Modifier** : Date de début = *il y a 3 semaines*, Échéance = *dans 2 mois*, statut **En cours**.
5. **Prédictions de risque** : ouvrir le projet B → explication de l'IA (facteurs qui font monter l'effort, sensibilité).
6. Générer le **bilan IA** du projet B (synthèse, risques, recommandations) → montrer l'**historique des bilans**.

---

## Acte 4 — Le chef monte son équipe et répartit le travail (6 min)

1. **Équipe** → **Ajouter un membre** (3 fois) :

| Prénom | Nom | Email | Poste | Rôle | Capacité (h/sem) |
|---|---|---|---|---|---|
| `Yassine` | `Gharbi` | `yassine.demo@nexus-demo.tn` | `Développeur front-end` | Membre d'équipe | `40` |
| `Sarra` | `Mejri` | `sarra.demo@nexus-demo.tn` | `Développeuse back-end` | Membre d'équipe | `35` |
| `Amine` | `Mansouri` | `amine.demo@nexus-demo.tn` | `Support client` | Agent support | `40` |

   → la carte **Identifiants** affiche le mot de passe temporaire (**Copier** et le noter).
2. Onglet **Équipes** → **Créer une équipe** : `Équipe Web` avec Yassine et Sarra.
3. **Tâches** → projet A → **Générer par IA** (6 tâches proposées).
4. Ajouter une tâche à la main :
   - Titre `Intégration du paiement en ligne`
   - Priorité Haute, Estimation `16 h`
   - **Échéance = hier** : elle servira à montrer une tâche **en retard**.
5. **Répartir automatiquement** → message « Yassine : 3 · Sarra : 4 » (le chef n'est jamais assigné, la charge est équilibrée selon la capacité).
6. Glisser-déposer une carte de « À faire » vers « En cours ».
7. Page **Équipe** → bouton **Excel** : export de la liste des membres.

---

## Acte 5 — L'espace employé (3 min)

**Fenêtre : Edge** → connexion `yassine.demo@nexus-demo.tn` + mot de passe temporaire.

1. **Mes tâches** : notification « Nouvelle tâche assignée », tâche en retard en rouge.
2. Passer une tâche en **Terminée** et saisir `6` heures passées
   → côté chef : notification **« Yassine a terminé … »** et l'avancement du projet augmente.
3. **Messages** → **Nouvelle conversation** : seul le chef est proposé → écrire :
   `Bonjour Oussama, la maquette de la page panier est prête pour relecture.`
4. **Planning** : calendrier des échéances.
5. Paramètres : changer la photo / la couleur des initiales.

**Fenêtre : Chrome privé (chef)** : badge sur **Messages** → répondre :
`Merci Yassine, je regarde cet après-midi.` → la réponse apparaît en direct chez Yassine, avec « Vu ».

---

## Acte 6 — Pilotage du chef (3 min)

1. **Suivi** → projet A :
   - score de santé, burndown (idéal vs réel), prévision de fin, charge par membre, activité récente.
2. **Planning** → vue **Gantt**.
3. **Assistant IA** : poser `Quels sont les risques principaux du projet ERP Logistique TransMed et que me conseilles-tu ?`
4. **Cloche** → filtres *Non lues / Alertes*, marquer comme lu, supprimer.

---

## Acte 7 — Le client du projet (6 min)

**Fenêtre : Chrome privé (chef)**

1. **Suivi** → projet A → carte **Client du projet** → **Inviter le client** :
   Prénom `Karim`, Email `…+client@gmail.com`, Société `Carthage Shop SARL`.
   → la carte affiche « Invitation envoyée, en attente ».

**Fenêtre : Firefox**

2. Email → lien → formulaire client :
   - bandeau « Jasmin Solutions vous invite à suivre votre projet »,
   - email verrouillé,
   - Nom `Ben Salah`, Téléphone `+216 98 765 432`, Fonction `Gérant`, Société pré-remplie, **pas de CV**.
3. **Mes projets** → **Suivi détaillé** :
   - courbe **réel vs prévu**, étapes, historique,
   - **aucune donnée interne** (ni risque IA, ni budget).
4. **Demander un changement** :
   - Objet `Ajouter le paiement en 3 fois`
   - Description `Nos clients demandent de pouvoir payer en 3 fois sans frais par carte bancaire.`
   - Priorité **Haute**
5. **Écrire au chef de projet** : `Bonjour, pouvez-vous me confirmer la date de mise en ligne ?`

**Fenêtre : Chrome privé (chef)**

6. Notification « Karim demande un changement » → **Demandes clients** → ouvrir :
   - Décision **Acceptée**
   - Réponse `Accepté : prévu au sprint 3, livraison dans 3 semaines.`
7. **Messages** → répondre à Karim : `Mise en ligne prévue le 15 du mois prochain.`

**Fenêtre : Firefox** : notification → la demande passe à **Acceptée**, avec la réponse ; le message du chef est visible.

---

## Acte 8 — Support client et tri par IA (5 min)

**Fenêtre : Firefox (client)** → **Mes tickets** → **Nouveau ticket** (projet A) :

| # | Titre | Message | Tri attendu par le modèle ML |
|---|---|---|---|
| 1 | `Plateforme indisponible` | `Plus personne ne peut travailler, la plateforme ne répond plus du tout depuis ce matin. C'est inacceptable !` | Bug · **Critique** · Négatif (97 %) |
| 2 | `Prélevé deux fois` | `Notre banque indique deux prélèvements identiques pour le mois d'octobre. Merci de corriger rapidement.` | Facturation · Haute · Neutre |
| 3 | `Idée d'amélioration` | `Ce serait génial de pouvoir dupliquer un projet existant. Merci pour votre super travail !` | Fonctionnalité · Basse · Positif |
| 4 | `Mot de passe` | `Je ne reçois pas l'email de réinitialisation du mot de passe, je suis bloqué.` | Compte · Moyenne · Neutre |
| 5 (arabe) | `المنصة متوقفة` | `لا أحد يستطيع العمل، المنصة لا تستجيب إطلاقًا. هذا غير مقبول.` | Bug · **Critique** · Négatif |

**Fenêtre : Edge** → déconnexion → connexion `amine.demo@nexus-demo.tn` (agent support)

1. Cloche : **alerte critique** + email pour le ticket 1.
2. **File d'attente** triée automatiquement : critiques et négatifs en premier ; badge **« Modèle ML · xx % »**.
3. Ouvrir le ticket 1 → **Suggestion IA** (brouillon de réponse dans la langue du client) → **Envoyer**
   → le ticket passe **En traitement** ; le client est notifié et voit la réponse dans le fil.
4. Ouvrir le ticket 4 → corriger l'urgence en **Haute** → « Corrections enregistrées pour améliorer le tri ».
5. Passer le ticket 3 en **Résolu** → le client est notifié.

---

## Acte 9 — La direction pilote l'entreprise (6 min)

**Fenêtre : Chrome normal (Direction)**

1. **Santé financière** → saisir le profil **sain** :

| Indicateur | Entreprise saine | Entreprise en difficulté |
|---|---|---|
| Ratio de liquidité générale | `0.028` | `0.004` |
| Trésorerie / Total actifs | `0.15` | `0.005` |
| ROA avant intérêts et dépréciation | `0.56` | `0.35` |
| Taux de marge opérationnelle | `0.999` | `0.998` |
| Ratio d'endettement | `0.08` | `0.22` |
| Capitaux propres / Actifs | `0.92` | `0.78` |
| Fonds de roulement / Actifs | `0.86` | `0.68` |
| Résultat net / Actifs | `0.83` | `0.72` |
| Rotation des actifs | `0.18` | `0.05` |
| Bénéfices non distribués / Actifs | `0.94` | `0.92` |
| Couverture des intérêts | `0.565` | `0.562` |
| Capitaux propres / Passifs | `0.045` | `0.013` |
| Flux de trésorerie / Actifs | `0.66` | `0.60` |
| **Résultat attendu** | **Saine**, faillite ≈ 0 %, score 100/100 | **À risque**, faillite ≈ **59 %** |

   - Profil sain → **Analyser la santé financière** → explications SHAP (facteurs qui rassurent / inquiètent) → **Enregistrer** → **Télécharger le rapport PDF**.
   - Profil en difficulté → **Analyser la santé financière** → **Enregistrer**
     → **alerte critique « Risque de faillite élevé »** (cloche + email) + bandeau rouge sur le tableau de bord.
2. **Vue générale** : score global de l'entreprise (projets + support + finance), bandeau d'alertes.
3. **Projets** → fiche du projet B (équipe, risque, bilan IA) ; **Équipe** (charge par personne).
4. **Support client** → carte **Modèle de tri des tickets** (version, précision) → **Ré-entraîner** (prend en compte la correction de l'acte 8).
5. **Messages** → écrire au chef : `Point hebdo : pouvez-vous me faire un retour sur le projet TransMed ?`
6. **Journal d'audit** : connexions, invitations, projets, tickets résolus, seuils modifiés.
7. **NEXUS AI** (assistant) : `Résume la situation de l'entreprise et propose 3 actions prioritaires.`

---

## Acte 10 — Sécurité (2 min)

1. **Paramètres** → **Double authentification** → scanner le QR code avec Google Authenticator → saisir le code → activée.
2. Déconnexion → reconnexion : le code à 6 chiffres est demandé.
3. Rappels :
   - 3 langues avec RTL,
   - invitations à usage unique, liées à l'adresse invitée,
   - accès limités par rôle (un client ne voit jamais les données internes ni la direction).

---

## Récapitulatif des fonctionnalités montrées

| Domaine | Fonctionnalités |
|---|---|
| IA | Prédiction d'effort et de risque (explications), bilan IA de projet, génération de tâches, assistant conversationnel, prédiction de faillite (SHAP), tri ML des tickets FR/EN/AR, suggestion de réponse, ré-entraînement |
| Alertes | Seuils configurables, notification critique + email + bandeau pour risque projet / faillite / ticket critique |
| Gestion de projet | Équipes, tâches Kanban, auto-assignation par charge, suivi (burndown, prévision, santé), planning calendrier + Gantt |
| Collaboration | Messagerie interne (chef ↔ direction / employés / client), notifications persistantes, navigateur |
| Client | Invitation par le chef, suivi détaillé, demandes de changement, tickets avec fil |
| Plateforme | 4 rôles + client, 3 langues + RTL, 2FA, journal d'audit, exports Excel/PDF, avatars photo/initiales |

## En cas de problème pendant la démo
- **Un service IA met longtemps** : il se réveille (≈ 50 s). Le tri des tickets bascule seul sur Groq.
- **Pas d'email reçu** : regarder dans les spams ; le chef peut renvoyer l'invitation depuis la carte client / la page Invitations.
- **Comptes de secours déjà prêts** (mot de passe `Password123!`) :
  - `direction2@nexus-demo.tn`
  - `chef1.entreprise2@nexus-demo.tn`
  - `employe1.chef1.entreprise2@nexus-demo.tn` (agent support)
  - `client2@nexus-demo.tn`
