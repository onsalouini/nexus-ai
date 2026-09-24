<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIReportService
{
    private const HEALTH_VALUES = ['Bonne', 'Moyenne', 'Préoccupante', 'Critique'];
    private const SEVERITY_VALUES = ['Faible', 'Modérée', 'Élevée', 'Critique'];

    /**
     * Génère le bilan explicable d'un projet à partir :
     *  - des données saisies,
     *  - du résultat du modèle ML,
     *  - de l'explication du modèle (sensibilité + importance globale).
     */
    public function generate(array $project): ?array
    {
        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'user', 'content' => $this->buildPrompt($project)],
        ];

        // 1re tentative en mode JSON strict, 2e sans response_format
        // (au cas où le modèle Groq configuré ne le supporterait pas).
        foreach ([true, false] as $useJsonMode) {
            $content = $this->callGroq($messages, $useJsonMode);

            if ($content === null) {
                continue;
            }

            $decoded = $this->parseJson($content);

            if ($decoded !== null) {
                return $this->normalize($decoded);
            }

            Log::warning('Groq report: JSON illisible', [
                'excerpt' => mb_substr($content, 0, 300),
            ]);
        }

        return null;
    }

    private function callGroq(array $messages, bool $jsonMode): ?string
    {
        try {
            $payload = [
                'model' => config('services.groq.model'),
                'temperature' => 0.3,
                'messages' => $messages,
            ];

            if ($jsonMode) {
                $payload['response_format'] = ['type' => 'json_object'];
            }

            $response = Http::timeout(90)
                ->withOptions(['verify' => false])
                ->withToken(config('services.groq.key'))
                ->acceptJson()
                ->post('https://api.groq.com/openai/v1/chat/completions', $payload);

            if ($response->failed()) {
                Log::error('Groq report error', [
                    'json_mode' => $jsonMode,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $content = $response->json('choices.0.message.content');

            return is_string($content) && trim($content) !== '' ? $content : null;
        } catch (\Throwable $e) {
            Log::error('Groq unavailable', ['message' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Accepte du JSON pur, du JSON entouré de ```json ... ``` ou de texte.
     */
    private function parseJson(string $content): ?array
    {
        $content = trim($content);

        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\{.*\}/s', $content, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    /**
     * Garantit une structure stable pour le frontend (valeurs autorisées,
     * tableaux présents) même si le LLM s'écarte légèrement du schéma.
     */
    private function normalize(array $r): array
    {
        $health = $r['health'] ?? null;

        $risks = [];
        foreach ((array) ($r['risks'] ?? []) as $risk) {
            if (!is_array($risk)) {
                continue;
            }

            $severity = $risk['severity'] ?? null;

            $risks[] = [
                'title' => (string) ($risk['title'] ?? 'Risque'),
                'description' => (string) ($risk['description'] ?? ''),
                'severity' => in_array($severity, self::SEVERITY_VALUES, true)
                    ? $severity
                    : 'Modérée',
            ];
        }

        $factors = [];
        foreach ((array) ($r['key_factors'] ?? []) as $factor) {
            if (!is_array($factor)) {
                continue;
            }

            $factors[] = [
                'factor' => (string) ($factor['factor'] ?? ''),
                'influence' => (string) ($factor['influence'] ?? ''),
                'explanation' => (string) ($factor['explanation'] ?? ''),
            ];
        }

        return [
            'summary' => (string) ($r['summary'] ?? ''),
            'health' => in_array($health, self::HEALTH_VALUES, true) ? $health : 'Moyenne',
            'strengths' => array_values(array_map('strval', (array) ($r['strengths'] ?? []))),
            'risks' => $risks,
            'recommendations' => array_values(array_map('strval', (array) ($r['recommendations'] ?? []))),
            'effort_analysis' => (string) ($r['effort_analysis'] ?? ''),
            'final_verdict' => (string) ($r['final_verdict'] ?? ''),

            // Partie « explicabilité »
            'model_explanation' => (string) ($r['model_explanation'] ?? ''),
            'key_factors' => $factors,
            'confidence_note' => (string) ($r['confidence_note'] ?? ''),
        ];
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Tu es NEXUS AI, un assistant expert en analyse et gestion de projets informatiques.

Tu rédiges le BILAN EXPLICABLE d'un projet : tu expliques au chef de projet POURQUOI le modèle de machine learning estime cet effort, et ce que cela implique.

RÈGLES IMPORTANTES :

- N'invente aucune donnée. Utilise UNIQUEMENT les chiffres fournis, sans les modifier ni les arrondir de façon trompeuse.
- Le résultat du modèle ML est une estimation, jamais une certitude.
- Le modèle est basé sur des arbres de décision : sa réponse n'est pas forcément proportionnelle. Quand le comportement d'une variable est indiqué "non linéaire", n'affirme PAS « plus de X = plus d'effort » : explique que le modèle réagit de façon irrégulière autour de la valeur saisie.
- Ne parle pas de causalité : dis que le modèle "associe" ou "est sensible à" une variable.
- Appuie model_explanation et key_factors sur l'analyse de sensibilité et l'importance globale fournies. Cite les variables les plus influentes en heures.
- Si l'analyse détaillée du modèle est absente, dis-le dans confidence_note et laisse key_factors vide.
- Donne des recommandations concrètes et applicables par un chef de projet.
- Réponds toujours en français.

Réponds UNIQUEMENT avec un objet JSON valide ayant exactement cette structure :

{
    "summary": "Résumé général du projet (2-3 phrases)",
    "health": "Bonne",
    "strengths": ["Point positif"],
    "risks": [
        {
            "title": "Titre du risque",
            "description": "Explication du risque",
            "severity": "Faible"
        }
    ],
    "recommendations": ["Recommandation concrète"],
    "effort_analysis": "Analyse de l'écart entre effort planifié et effort estimé",
    "model_explanation": "Explication en 3 à 5 phrases de POURQUOI le modèle aboutit à cet effort, à partir des variables les plus influentes",
    "key_factors": [
        {
            "factor": "Nom de la variable",
            "influence": "Augmente l'effort",
            "explanation": "Ce que montre l'analyse de sensibilité pour cette variable, avec les chiffres"
        }
    ],
    "confidence_note": "Limites de cette estimation et précautions d'interprétation",
    "final_verdict": "Conclusion globale"
}

health doit être l'une de : Bonne, Moyenne, Préoccupante, Critique.
severity doit être l'une de : Faible, Modérée, Élevée, Critique.
influence doit être l'une de : Augmente l'effort, Réduit l'effort, Impact irrégulier, Impact faible.
key_factors : 3 à 5 éléments maximum, classés du plus influent au moins influent.
PROMPT;
    }

    private function buildPrompt(array $p): string
    {
        $name = $p['name'] ?? '';
        $description = $p['description'] ?? 'Non renseignée';
        $explanation = $this->formatExplanation($p['risk_explanation'] ?? null);

        return <<<PROMPT
Analyse ce projet NEXUS AI et produis son bilan explicable.

DONNÉES DU PROJET

Nom : {$name}
Description : {$description}
Expérience équipe (années) : {$p['team_exp']}
Expérience chef de projet (années) : {$p['manager_exp']}
Durée (mois) : {$p['length']}
Transactions : {$p['transactions']}
Entités : {$p['entities']}
Points de fonction non ajustés : {$p['points_non_adjust']}
Facteur d'ajustement (multiplicateur VAF) : {$p['adjustment']}
Langage (code) : {$p['language']}

RÉSULTAT DU MODÈLE ML

Effort planifié : {$p['planned_effort']} heures
Effort estimé par le modèle : {$p['predicted_effort']} heures
Écart : {$p['gap_percent']} %
Niveau de risque : {$p['risk_level']}
Seuils : Faible si écart ≤ 10 %, Modéré si 10 % < écart ≤ 35 %, Élevé si écart > 35 %.

EXPLICATION DU MODÈLE

{$explanation}

Produis le bilan complet au format JSON demandé.
PROMPT;
    }

    private function formatExplanation(?array $explanation): string
    {
        if (empty($explanation['sensitivity'])) {
            return "Aucune analyse détaillée du modèle n'est disponible pour ce projet.";
        }

        $lines = [
            'Analyse de sensibilité (effort prédit si la variable varie de ±20 %, les autres restant fixes ; écarts en heures par rapport à l\'effort estimé) :',
            "Note : le facteur d'ajustement est exprimé ici sur l'échelle interne du modèle (0 à 70), avec VAF = 0.65 + 0.01 × valeur.",
        ];

        foreach ($explanation['sensitivity'] as $f) {
            $lines[] = sprintf(
                '- %s (valeur saisie : %s) : -20 %% => %s h ; +20 %% => %s h ; comportement : %s',
                $f['label'] ?? '?',
                $f['value'] ?? '?',
                $this->signed($f['delta_minus_20'] ?? 0),
                $this->signed($f['delta_plus_20'] ?? 0),
                $f['behavior'] ?? 'inconnu'
            );
        }

        if (!empty($explanation['global_importance'])) {
            $lines[] = '';
            $lines[] = 'Importance globale des variables dans le modèle entraîné (part de 0 à 1) :';

            foreach ($explanation['global_importance'] as $g) {
                $lines[] = sprintf('- %s : %s', $g['label'] ?? '?', $g['importance'] ?? '?');
            }
        }

        if (!empty($explanation['limits'])) {
            $lines[] = '';
            $lines[] = 'Limites : ' . $explanation['limits'];
        }

        return implode("\n", $lines);
    }

    private function signed(mixed $value): string
    {
        $value = (float) $value;
        $text = rtrim(rtrim(number_format($value, 1, '.', ''), '0'), '.');

        return ($value > 0 ? '+' : '') . ($text === '' || $text === '-0' ? '0' : $text);
    }
}
