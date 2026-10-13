"""
Jeu de données d'entraînement du tri des tickets (catégorie, urgence, sentiment).

Deux sources :
  1. Un corpus généré en français, anglais et arabe à partir de formulations réalistes
     (problème + niveau d'urgence + ton du client), toujours disponible.
  2. Optionnel : le dataset Kaggle « Customer Support Ticket Dataset »
     (colonnes Ticket Subject / Ticket Description / Ticket Type / Ticket Priority),
     passé avec --kaggle chemin.csv à train.py.
Les corrections des agents (envoyées par Laravel à /train) s'ajoutent par-dessus.
"""
import csv
import random

CATEGORIES = ["bug", "billing", "feature", "account", "other"]
URGENCIES = ["low", "medium", "high", "critical"]
SENTIMENTS = ["negative", "neutral", "positive"]

# ---------------------------------------------------------------------------
# Problèmes par catégorie : (titre, description)
# ---------------------------------------------------------------------------
PROBLEMS = {
    "fr": {
        "bug": [
            ("L'application plante", "L'application se ferme toute seule quand j'ouvre le tableau de bord."),
            ("Erreur 500", "J'obtiens une erreur 500 en enregistrant un nouveau projet."),
            ("Page blanche", "Après la connexion, la page reste blanche et rien ne se charge."),
            ("Export PDF vide", "L'export PDF du rapport génère un fichier vide."),
            ("Bouton inactif", "Le bouton Enregistrer ne réagit plus quand je clique dessus."),
            ("Données incorrectes", "Les chiffres affichés dans le graphique ne correspondent pas à nos données."),
            ("Synchronisation en échec", "La synchronisation échoue depuis la dernière mise à jour."),
            ("Bug sur le planning", "Le calendrier affiche les tâches au mauvais jour."),
            ("Fichier impossible à importer", "L'import du fichier Excel s'arrête avec un message d'erreur."),
            ("Lenteur extrême", "Chaque page met plus d'une minute à charger, l'outil est inutilisable."),
            ("Notifications cassées", "Les notifications ne s'affichent plus depuis hier."),
            ("Crash sur mobile", "Sur téléphone, l'application crashe dès l'ouverture."),
            ("Plateforme indisponible", "La plateforme ne répond plus, impossible d'accéder à quoi que ce soit."),
            ("Rapports très lents", "La génération des rapports prend des minutes et finit parfois en timeout."),
            ("Valeurs aberrantes", "Le tableau affiche des montants négatifs qui n'existent pas."),
        ],
        "billing": [
            ("Double facturation", "J'ai été prélevé deux fois ce mois-ci pour le même abonnement."),
            ("Facture incorrecte", "Le montant de ma dernière facture ne correspond pas à notre offre."),
            ("Demande de remboursement", "Je souhaite être remboursé du mois en cours."),
            ("Paiement refusé", "Mon paiement par carte bancaire est refusé alors que la carte est valide."),
            ("Changer de moyen de paiement", "Comment modifier la carte utilisée pour le paiement ?"),
            ("Facture avec TVA", "J'ai besoin d'une facture faisant apparaître la TVA et notre numéro fiscal."),
            ("Copie de facture", "Pouvez-vous m'envoyer à nouveau la facture du mois dernier ?"),
            ("Prix de l'abonnement", "Le prix de l'abonnement a augmenté sans que nous soyons prévenus."),
            ("Prélèvement inconnu", "Un prélèvement que je ne reconnais pas apparaît sur notre relevé."),
        ],
        "account": [
            ("Connexion impossible", "Je n'arrive plus à me connecter à mon compte."),
            ("Mot de passe oublié", "Le lien de réinitialisation du mot de passe a expiré."),
            ("Compte bloqué", "Mon compte est bloqué après plusieurs tentatives de connexion."),
            ("Changer d'adresse email", "Je voudrais changer l'adresse email associée à mon compte."),
            ("Supprimer mon compte", "Merci de supprimer mon compte et mes données personnelles."),
            ("Code de double authentification", "Le code de double authentification est toujours refusé."),
            ("Ajouter un utilisateur", "Comment donner accès à un nouveau collaborateur sur notre compte ?"),
            ("Accès refusé", "Je reçois « accès non autorisé » sur une page que j'utilisais avant."),
        ],
        "feature": [
            ("Suggestion : mode sombre", "Serait-il possible d'ajouter un mode sombre à l'application ?"),
            ("Export Excel", "Nous aimerions pouvoir exporter les tableaux au format Excel."),
            ("Intégration Slack", "Pouvez-vous prévoir une intégration avec Slack dans une prochaine version ?"),
            ("Nouvelle fonctionnalité", "Ce serait pratique d'avoir des rappels automatiques avant les échéances."),
            ("Amélioration du tableau de bord", "Je propose d'ajouter un filtre par équipe sur le tableau de bord."),
            ("Application mobile", "Avez-vous prévu une application mobile ? Ce serait très utile."),
            ("Rapports personnalisés", "Nous souhaiterions créer nos propres modèles de rapports."),
            ("API publique", "Une API publique nous permettrait de connecter nos outils internes."),
        ],
        "other": [
            ("Horaires du support", "Quels sont les horaires d'ouverture de votre support ?"),
            ("Informations sur les offres", "Je voudrais des informations sur vos différentes offres."),
            ("Rendez-vous commercial", "Pouvons-nous planifier un appel avec un commercial ?"),
            ("Documentation", "Où puis-je trouver la documentation utilisateur ?"),
            ("Formation de l'équipe", "Proposez-vous des sessions de formation pour notre équipe ?"),
            ("Question sur le contrat", "J'ai une question concernant la durée de notre contrat."),
            ("Partenariat", "Nous aimerions discuter d'un éventuel partenariat."),
            ("Retour d'expérience", "Je voulais simplement partager notre retour après trois mois d'utilisation."),
            ("Changer d'offre", "Nous envisageons de passer à une offre supérieure, qui peut nous conseiller ?"),
            ("Webinaires", "Organisez-vous des présentations en ligne pour découvrir l'outil ?"),
        ],
    },
    "en": {
        "bug": [
            ("App crashes", "The application closes by itself when I open the dashboard."),
            ("Error 500", "I get a 500 error when saving a new project."),
            ("Blank page", "After logging in, the page stays blank and nothing loads."),
            ("Empty PDF export", "The PDF export of the report produces an empty file."),
            ("Button not working", "The Save button does nothing when I click it."),
            ("Wrong data", "The numbers in the chart don't match our data."),
            ("Sync failing", "Synchronization keeps failing since the last update."),
            ("Calendar bug", "The calendar shows tasks on the wrong day."),
            ("Import broken", "Importing the Excel file stops with an error message."),
            ("Extremely slow", "Every page takes more than a minute to load, the tool is unusable."),
            ("Notifications broken", "Notifications stopped showing up since yesterday."),
            ("Mobile crash", "On my phone the app crashes as soon as it opens."),
            ("Platform unavailable", "The platform is not responding, we cannot access anything."),
            ("Very slow reports", "Generating reports takes minutes and sometimes times out."),
            ("Weird values", "The table shows negative amounts that don't exist."),
        ],
        "billing": [
            ("Charged twice", "I was charged twice this month for the same subscription."),
            ("Wrong invoice", "The amount on my last invoice doesn't match our plan."),
            ("Refund request", "I would like a refund for the current month."),
            ("Payment declined", "My card payment is declined although the card is valid."),
            ("Change payment method", "How can I change the card used for billing?"),
            ("Invoice with VAT", "I need an invoice showing VAT and our tax number."),
            ("Invoice copy", "Could you send me last month's invoice again?"),
            ("Subscription price", "The subscription price went up without any notice."),
            ("Unknown charge", "There is a charge on our statement that I don't recognize."),
        ],
        "account": [
            ("Cannot log in", "I can no longer log in to my account."),
            ("Forgot password", "The password reset link has expired."),
            ("Account locked", "My account got locked after several login attempts."),
            ("Change email address", "I want to change the email address on my account."),
            ("Delete my account", "Please delete my account and my personal data."),
            ("Two-factor code", "The two-factor authentication code is always rejected."),
            ("Add a user", "How do I give a new colleague access to our account?"),
            ("Access denied", "I get 'access denied' on a page I used to open."),
        ],
        "feature": [
            ("Suggestion: dark mode", "Could you add a dark mode to the application?"),
            ("Excel export", "We would like to export tables to Excel."),
            ("Slack integration", "Could you plan a Slack integration in a future release?"),
            ("Feature request", "It would be handy to get automatic reminders before deadlines."),
            ("Dashboard improvement", "I suggest adding a filter by team on the dashboard."),
            ("Mobile app", "Are you planning a mobile app? It would be really useful."),
            ("Custom reports", "We'd like to build our own report templates."),
            ("Public API", "A public API would let us connect our internal tools."),
        ],
        "other": [
            ("Support hours", "What are your support opening hours?"),
            ("Pricing information", "I'd like some information about your plans."),
            ("Sales meeting", "Can we schedule a call with someone from sales?"),
            ("Documentation", "Where can I find the user documentation?"),
            ("Team training", "Do you offer training sessions for our team?"),
            ("Contract question", "I have a question about the length of our contract."),
            ("Partnership", "We'd like to talk about a possible partnership."),
            ("Feedback", "I just wanted to share our feedback after three months of use."),
            ("Upgrade plan", "We are thinking about moving to a bigger plan, who can advise us?"),
            ("Webinars", "Do you run online sessions to discover the tool?"),
        ],
    },
    "ar": {
        "bug": [
            ("التطبيق يتوقف", "التطبيق يغلق من تلقاء نفسه عندما أفتح لوحة التحكم."),
            ("خطأ 500", "يظهر لي خطأ 500 عند حفظ مشروع جديد."),
            ("صفحة بيضاء", "بعد تسجيل الدخول تبقى الصفحة بيضاء ولا يتم تحميل أي شيء."),
            ("تصدير PDF فارغ", "تصدير التقرير بصيغة PDF ينتج ملفًا فارغًا."),
            ("الزر لا يعمل", "زر الحفظ لا يستجيب عندما أضغط عليه."),
            ("بيانات خاطئة", "الأرقام في الرسم البياني لا تطابق بياناتنا."),
            ("فشل المزامنة", "المزامنة تفشل منذ آخر تحديث."),
            ("عطل في التقويم", "التقويم يعرض المهام في اليوم الخطأ."),
            ("تعذر الاستيراد", "استيراد ملف Excel يتوقف مع رسالة خطأ."),
            ("بطء شديد", "كل صفحة تستغرق أكثر من دقيقة للتحميل، الأداة غير قابلة للاستخدام."),
            ("المنصة لا تستجيب", "المنصة لا تستجيب ولا يمكننا الوصول إلى أي شيء."),
        ],
        "billing": [
            ("خصم مرتين", "تم خصم المبلغ مرتين هذا الشهر لنفس الاشتراك."),
            ("فاتورة خاطئة", "مبلغ الفاتورة الأخيرة لا يطابق باقتنا."),
            ("طلب استرداد", "أرغب في استرداد مبلغ الشهر الحالي."),
            ("رفض الدفع", "تم رفض الدفع بالبطاقة رغم أن البطاقة صالحة."),
            ("تغيير وسيلة الدفع", "كيف يمكنني تغيير البطاقة المستخدمة للدفع؟"),
            ("فاتورة مع الضريبة", "أحتاج إلى فاتورة تتضمن الضريبة والرقم الجبائي."),
        ],
        "account": [
            ("تعذر تسجيل الدخول", "لم أعد أستطيع تسجيل الدخول إلى حسابي."),
            ("نسيت كلمة المرور", "رابط إعادة تعيين كلمة المرور منتهي الصلاحية."),
            ("الحساب مقفل", "تم قفل حسابي بعد عدة محاولات لتسجيل الدخول."),
            ("تغيير البريد الإلكتروني", "أريد تغيير البريد الإلكتروني المرتبط بحسابي."),
            ("حذف الحساب", "يرجى حذف حسابي وبياناتي الشخصية."),
            ("رمز التحقق الثنائي", "رمز المصادقة الثنائية مرفوض دائمًا."),
        ],
        "feature": [
            ("اقتراح: الوضع الداكن", "هل يمكن إضافة وضع داكن إلى التطبيق؟"),
            ("تصدير Excel", "نود تصدير الجداول بصيغة Excel."),
            ("تكامل مع Slack", "هل يمكن إضافة تكامل مع Slack في إصدار قادم؟"),
            ("ميزة جديدة", "سيكون من المفيد الحصول على تذكيرات تلقائية قبل المواعيد النهائية."),
            ("تطبيق للجوال", "هل تخططون لتطبيق على الهاتف؟ سيكون مفيدًا جدًا."),
            ("تقارير مخصصة", "نرغب في إنشاء قوالب تقارير خاصة بنا."),
        ],
        "other": [
            ("أوقات الدعم", "ما هي أوقات عمل فريق الدعم؟"),
            ("معلومات عن العروض", "أريد معلومات عن الباقات المتوفرة."),
            ("موعد مع المبيعات", "هل يمكننا تحديد مكالمة مع فريق المبيعات؟"),
            ("الوثائق", "أين أجد دليل المستخدم؟"),
            ("تدريب الفريق", "هل تقدمون جلسات تدريبية لفريقنا؟"),
            ("سؤال عن العقد", "لدي سؤال حول مدة العقد."),
            ("ترقية الباقة", "نفكر في الانتقال إلى باقة أكبر، من يمكنه مساعدتنا؟"),
        ],
    },
}

# ---------------------------------------------------------------------------
# Indices d'urgence et de ton (préfixes / suffixes)
# ---------------------------------------------------------------------------
URGENCY_HINTS = {
    "fr": {
        "critical": ["URGENT : la production est à l'arrêt.", "Tous nos utilisateurs sont bloqués.",
                     "C'est critique, nous perdons des ventes en ce moment.", "À traiter immédiatement, le service est indisponible.",
                     "Toute l'entreprise est bloquée depuis ce matin.", "Plus aucun collaborateur ne peut travailler.", "Nous sommes totalement à l'arrêt, chaque minute nous coûte cher."],
        "high": ["C'est assez urgent.", "Cela bloque notre équipe.", "Merci de traiter rapidement.",
                 "Important pour notre livraison de vendredi.", "Nous avons besoin d'une réponse aujourd'hui.", "Ça m'empêche de faire mon travail.", "Merci de corriger au plus vite."],
        "medium": ["", "Merci de regarder quand possible.", "Pouvez-vous vérifier ?"],
        "low": ["Rien de pressé.", "Aucune urgence.", "Ce n'est pas urgent.", "Pas urgent.", "Quand vous aurez le temps.", "Simple question, pour information.", "À votre convenance."],
    },
    "en": {
        "critical": ["URGENT: production is down.", "All our users are blocked.",
                     "This is critical, we are losing sales right now.", "Please handle immediately, the service is unavailable.",
                     "The whole company has been blocked since this morning.", "None of our staff can work anymore.", "We are completely stopped, every minute costs us."],
        "high": ["This is fairly urgent.", "It's blocking our team.", "Please handle this quickly.",
                 "Important for our Friday delivery.", "We need an answer today.", "It prevents me from doing my job.", "Please fix it as soon as possible."],
        "medium": ["", "Please take a look when possible.", "Could you check?"],
        "low": ["No rush.", "Not urgent at all.", "It's not urgent.", "Whenever you have time.", "Just a question, for information.", "At your convenience."],
    },
    "ar": {
        "critical": ["عاجل: الإنتاج متوقف.", "جميع المستخدمين لدينا محظورون.", "الأمر حرج، نخسر مبيعات الآن.",
                     "يرجى المعالجة فورًا، الخدمة غير متاحة.", "لا أحد من موظفينا يستطيع العمل."],
        "high": ["الأمر مستعجل نوعًا ما.", "هذا يعطل فريقنا.", "يرجى المعالجة بسرعة.", "مهم لتسليم يوم الجمعة.", "هذا يمنعني من القيام بعملي.", "يرجى الإصلاح في أقرب وقت."],
        "medium": ["", "يرجى الاطلاع عند الإمكان.", "هل يمكنكم التحقق؟"],
        "low": ["ليس مستعجلًا.", "لا يوجد استعجال.", "الأمر غير عاجل.", "عندما يتوفر لديكم الوقت.", "مجرد سؤال للعلم."],
    },
}

TONE_HINTS = {
    "fr": {
        "negative": ["C'est inacceptable.", "Je suis très déçu de votre service.", "C'est la troisième fois que je vous écris, toujours rien.",
                     "Votre outil est catastrophique.", "J'en ai vraiment assez de ces problèmes.", "Nous sommes très mécontents."],
        "neutral": ["", "Bonjour,", "Cordialement.", "Merci."],
        "positive": ["Merci beaucoup, votre équipe est géniale.", "Super outil par ailleurs, bravo !",
                     "Merci d'avance pour votre aide précieuse, on adore l'application.", "Bravo pour la dernière version, elle est excellente.", "Merci pour votre excellent travail !", "Merci infiniment, vous êtes au top."],
    },
    "en": {
        "negative": ["This is unacceptable.", "I'm very disappointed with your service.", "This is the third time I write, still nothing.",
                     "Your tool is a disaster.", "I'm really fed up with these problems.", "We are very unhappy."],
        "neutral": ["", "Hello,", "Regards.", "Thanks."],
        "positive": ["Thanks a lot, your team is great.", "Great tool otherwise, well done!",
                     "Thanks in advance for your help, we love the app.", "Congrats on the latest release, it's excellent.", "Thanks for the amazing work!", "Thank you so much, you rock."],
    },
    "ar": {
        "negative": ["هذا غير مقبول.", "أنا مستاء جدًا من خدمتكم.", "هذه ثالث مرة أكتب لكم ولا شيء.",
                     "أداتكم سيئة للغاية.", "لقد سئمت من هذه المشاكل."],
        "neutral": ["", "مرحبًا،", "مع التحية.", "شكرًا."],
        "positive": ["شكرًا جزيلًا، فريقكم رائع.", "أداة ممتازة بالمناسبة، أحسنتم!", "شكرًا مقدمًا على مساعدتكم، نحب التطبيق.", "شكرًا على عملكم الرائع!"],
    },
}

TITLE_PREFIX = {"critical": {"fr": "URGENT - ", "en": "URGENT - ", "ar": "عاجل - "}, "high": {"fr": "Important : ", "en": "Important: ", "ar": "مهم: "}}

# Urgence plausible par catégorie (pondérations low, medium, high, critical)
URGENCY_WEIGHTS = {
    "bug": [1, 3, 3, 2],
    "billing": [1, 3, 2, 1],
    "account": [1, 3, 3, 1],
    "feature": [5, 3, 1, 0],
    "other": [5, 3, 1, 0],
}


# Sans indice explicite, l'urgence dépend surtout du type de demande
DEFAULT_URGENCY = {"bug": "medium", "billing": "medium", "account": "medium", "feature": "low", "other": "low"}


def generate(n: int = 6000, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    rows = []
    langs = ["fr"] * 5 + ["en"] * 3 + ["ar"] * 2
    for _ in range(n):
        lang = rng.choice(langs)
        category = rng.choice(CATEGORIES)
        urgency = rng.choices(URGENCIES, weights=URGENCY_WEIGHTS[category])[0]
        sentiment = rng.choices(SENTIMENTS, weights=[3, 4, 2] if urgency in ("high", "critical") else [2, 5, 3])[0]

        title, body = rng.choice(PROBLEMS[lang][category])
        hint = rng.choice(URGENCY_HINTS[lang][urgency])
        if rng.random() < 0.3:
            urgency, hint = DEFAULT_URGENCY[category], ""
        elif urgency in TITLE_PREFIX and rng.random() < 0.5:
            title = TITLE_PREFIX[urgency][lang] + title

        parts = [hint, rng.choice(TONE_HINTS[lang][sentiment])]
        rng.shuffle(parts)
        description = " ".join(p for p in [body, *parts] if p)
        rows.append({"title": title, "description": description, "category": category,
                     "urgency": urgency, "sentiment": sentiment, "source": "generated", "group": body})
    return rows


# Correspondance des colonnes du dataset Kaggle « Customer Support Ticket Dataset »
KAGGLE_TYPE = {
    "technical issue": "bug", "billing inquiry": "billing", "refund request": "billing",
    "product inquiry": "feature", "cancellation request": "account",
}


def load_kaggle(path: str) -> list[dict]:
    rows = []
    with open(path, encoding="utf-8", errors="ignore") as f:
        for r in csv.DictReader(f):
            category = KAGGLE_TYPE.get((r.get("Ticket Type") or "").strip().lower())
            urgency = (r.get("Ticket Priority") or "").strip().lower()
            if not category or urgency not in URGENCIES:
                continue
            rows.append({
                "title": r.get("Ticket Subject") or "",
                "description": r.get("Ticket Description") or "",
                "category": category, "urgency": urgency, "sentiment": None, "source": "kaggle",
            })
    return rows
