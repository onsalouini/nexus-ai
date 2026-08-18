<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIReportService
{
    public function generate(array $project): ?array
    {
        $prompt = $this->buildPrompt($project);

        try {
           $response = Http::timeout(90)
    ->withOptions([
        'verify' => false,
    ])
    ->withToken(config('services.groq.key'))
    ->acceptJson()
    ->post('https://api.groq.com/openai/v1/chat/completions',
                    [
                        'model' => config('services.groq.model'),
                        'temperature' => 0.3,

                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => $this->systemPrompt(),
                            ],
                            [
                                'role' => 'user',
                                'content' => $prompt,
                            ],
                        ],
                    ]
                );

            if ($response->failed()) {
                Log::error('Groq report error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $content = $response->json('choices.0.message.content');

            if (!$content) {
                return null;
            }

            return json_decode($content, true);

        } catch (\Throwable $e) {
            Log::error('Groq unavailable', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Tu es NEXUS AI, un assistant expert en analyse et gestion de projets informatiques.

Tu analyses les données fournies par le système.

IMPORTANT :

- Ne modifie jamais les valeurs numériques fournies.
- Ne présente jamais une estimation comme une certitude.
- Le résultat du modèle ML est une estimation quantitative.
- Explique les résultats de manière claire pour un chef de projet.
- Identifie les risques.
- Donne des recommandations concrètes.
- N'invente aucune donnée absente.
- Réponds toujours en français.

Réponds UNIQUEMENT avec un objet JSON valide ayant exactement cette structure :

{
    "summary": "Résumé général du projet",
    "health": "Bonne",
    "strengths": [
        "Point positif"
    ],
    "risks": [
        {
            "title": "Titre du risque",
            "description": "Explication du risque",
            "severity": "Faible"
        }
    ],
    "recommendations": [
        "Recommandation concrète"
    ],
    "effort_analysis": "Analyse de l'écart entre effort prévu et effort estimé",
    "final_verdict": "Conclusion globale"
}

La valeur de health doit être l'une des suivantes :

- Bonne
- Moyenne
- Préoccupante
- Critique

La valeur de severity doit être l'une des suivantes :

- Faible
- Modérée
- Élevée
- Critique
PROMPT;
    }

    private function buildPrompt(array $project): string
    {
        return <<<PROMPT
Analyse ce projet NEXUS AI.

DONNÉES DU PROJET

Nom :
{$project['name']}

Description :
{$project['description']}

Expérience équipe :
{$project['team_exp']}

Expérience manager :
{$project['manager_exp']}

Durée :
{$project['length']}

Transactions :
{$project['transactions']}

Entités :
{$project['entities']}

Points non ajustés :
{$project['points_non_adjust']}

Ajustement :
{$project['adjustment']}

Langage :
{$project['language']}

EFFORT

Effort planifié :
{$project['planned_effort']} heures

Effort estimé par le modèle ML :
{$project['predicted_effort']} heures

Niveau de risque calculé :
{$project['risk_level']}

Écart calculé :
{$project['gap_percent']} %

Analyse ces données et produis le bilan complet du projet.

Ne modifie aucune valeur numérique fournie.
N'invente aucune information qui n'est pas présente dans les données.
Explique clairement les risques et propose des recommandations concrètes.

PROMPT;
    }
}
