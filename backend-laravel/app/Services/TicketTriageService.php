<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/*
| Tri automatique d'un ticket support : catégorie, urgence et sentiment.
| 1. Modèle ML maison (ai-services/ticket-service, TF-IDF + régression logistique)
| 2. Groq si le service ML est indisponible
| 3. Analyse par mots-clés (français / anglais / arabe) en dernier recours
| L'agent peut toujours corriger le résultat ; ses corrections ré-entraînent le modèle.
*/
class TicketTriageService
{
    private const KEYWORDS = [
        'category' => [
            'bug' => ['bug', 'erreur', 'error', 'crash', 'plante', 'bloqué', 'ne marche pas', 'ne fonctionne', "doesn't work", 'broken', 'خطأ', 'عطل', 'لا يعمل'],
            'billing' => ['facture', 'paiement', 'remboursement', 'prix', 'invoice', 'payment', 'refund', 'billing', 'فاتورة', 'دفع', 'استرداد'],
            'account' => ['compte', 'mot de passe', 'connexion', 'login', 'password', 'account', 'accès', 'حساب', 'كلمة المرور', 'تسجيل الدخول'],
            'feature' => ['fonctionnalité', 'amélioration', 'suggestion', 'ajouter', 'feature', 'request', 'would like', 'ميزة', 'اقتراح', 'تحسين'],
        ],
        'critical' => ['urgent', 'urgence', 'critique', 'production', 'immédiatement', 'asap', 'critical', 'down', 'tout est bloqué', 'عاجل', 'حرج', 'فورًا'],
        'high' => ['rapidement', 'important', 'bloquant', 'quickly', 'blocking', 'important', 'مهم', 'بسرعة'],
        'negative' => ['inacceptable', 'déçu', 'mécontent', 'énervé', 'nul', 'honte', 'angry', 'disappointed', 'terrible', 'unacceptable', 'غاضب', 'سيء', 'غير مقبول'],
        'positive' => ['merci', 'super', 'génial', 'bravo', 'thanks', 'great', 'awesome', 'شكرا', 'ممتاز', 'رائع'],
    ];

    /** @return array{category:string, urgency:string, sentiment:string, triage_source:string, triage_confidence:?array} */
    public function classify(string $title, string $description): array
    {
        if ($ml = $this->classifyWithModel($title, $description)) {
            return $ml;
        }
        if ($groq = $this->classifyWithGroq($title, $description)) {
            return [...$groq, 'triage_source' => 'groq', 'triage_confidence' => null];
        }

        return [...$this->classifyWithKeywords($title, $description), 'triage_source' => 'keywords', 'triage_confidence' => null];
    }

    private function serviceUrl(): ?string
    {
        $url = config('services.ticket_ai.url');

        return $url ? rtrim($url, '/') : null;
    }

    private function classifyWithModel(string $title, string $description): ?array
    {
        if (! $url = $this->serviceUrl()) {
            return null;
        }

        try {
            $data = Http::timeout(8)->post("{$url}/predict", ['title' => $title, 'description' => $description])->throw()->json();

            $valid = in_array($data['category'] ?? null, \App\Models\Ticket::CATEGORIES, true)
                && in_array($data['urgency'] ?? null, \App\Models\Ticket::URGENCIES, true)
                && in_array($data['sentiment'] ?? null, \App\Models\Ticket::SENTIMENTS, true);

            return $valid ? [
                'category' => $data['category'],
                'urgency' => $data['urgency'],
                'sentiment' => $data['sentiment'],
                'triage_source' => 'ml',
                'triage_confidence' => $data['confidence'] ?? null,
            ] : null;
        } catch (\Throwable $e) {
            Log::warning('Service ML de tri des tickets indisponible', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /** État du modèle (version, métriques) ; null si le service est injoignable. */
    public function modelStatus(): ?array
    {
        if (! $url = $this->serviceUrl()) {
            return null;
        }
        try {
            return Http::timeout(5)->get("{$url}/health")->throw()->json('model');
        } catch (\Throwable) {
            return null;
        }
    }

    /** Ré-entraîne le modèle avec les tickets corrigés par les agents. */
    public function retrain(array $samples): ?array
    {
        if (! $url = $this->serviceUrl()) {
            return null;
        }
        $request = Http::timeout(180);
        if ($token = config('services.ticket_ai.token')) {
            $request = $request->withToken($token);
        }

        return $request->post("{$url}/train", ['samples' => $samples])->throw()->json('model');
    }

    public function classifyWithKeywords(string $title, string $description): array
    {
        $text = mb_strtolower($title . ' ' . $description);
        $has = fn (array $words) => collect($words)->contains(fn ($w) => str_contains($text, mb_strtolower($w)));

        $category = 'other';
        foreach (self::KEYWORDS['category'] as $name => $words) {
            if ($has($words)) {
                $category = $name;
                break;
            }
        }

        $sentiment = $has(self::KEYWORDS['negative']) ? 'negative' : ($has(self::KEYWORDS['positive']) ? 'positive' : 'neutral');

        $urgency = match (true) {
            $has(self::KEYWORDS['critical']) => 'critical',
            $has(self::KEYWORDS['high']) || ($category === 'bug' && $sentiment === 'negative') => 'high',
            $category === 'feature' || $sentiment === 'positive' => 'low',
            default => 'medium',
        };

        return compact('category', 'urgency', 'sentiment');
    }

    private function classifyWithGroq(string $title, string $description): ?array
    {
        $key = config('services.groq.key');
        if (! $key || app()->runningUnitTests()) {
            return null;
        }

        try {
            $response = Http::withToken($key)->timeout(10)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model'),
                'temperature' => 0,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => 'Classify a customer support ticket. Answer ONLY with JSON: {"category":"bug|billing|feature|account|other","urgency":"low|medium|high|critical","sentiment":"negative|neutral|positive"}'],
                    ['role' => 'user', 'content' => "Title: {$title}\nMessage: {$description}"],
                ],
            ]);

            $data = json_decode($response->json('choices.0.message.content') ?? '', true);
            if (! is_array($data)) {
                return null;
            }

            $valid = in_array($data['category'] ?? null, \App\Models\Ticket::CATEGORIES, true)
                && in_array($data['urgency'] ?? null, \App\Models\Ticket::URGENCIES, true)
                && in_array($data['sentiment'] ?? null, \App\Models\Ticket::SENTIMENTS, true);

            return $valid ? array_intersect_key($data, array_flip(['category', 'urgency', 'sentiment'])) : null;
        } catch (\Throwable $e) {
            Log::warning('Tri ticket Groq indisponible', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
