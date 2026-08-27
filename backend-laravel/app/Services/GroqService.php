<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    /**
     * Générer une introduction pour une invitation.
     */
    public function generateInvitationIntro(
        string $firstName,
        string $role,
        string $companyName
    ): ?string {
        $roleLabel = match ($role) {
            'chef_de_projet' => 'chef de projet',
            'agent_support' => 'agent support',
            default => $role,
        };

        try {
            $response = Http::withToken(
                config('services.groq.key')
            )
                ->timeout(6)
                ->post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    [
                        'model' => config('services.groq.model'),

                        'messages' => [
                            [
                                'role' => 'system',
                                'content' =>
                                    'Tu ecris une seule phrase courte, '
                                    . 'chaleureuse et professionnelle en francais '
                                    . 'pour introduire un email d\'invitation. '
                                    . 'Pas de guillemets, pas de signature, '
                                    . 'une seule phrase.',
                            ],
                            [
                                'role' => 'user',
                                'content' =>
                                    "Prenom: {$firstName} | "
                                    . "Role propose: {$roleLabel} | "
                                    . "Entreprise: {$companyName}",
                            ],
                        ],

                        'max_tokens' => 60,
                        'temperature' => 0.7,
                    ]
                );

            if ($response->failed()) {
                Log::warning(
                    'Groq invitation intro failed',
                    [
                        'status' => $response->status(),
                    ]
                );

                return null;
            }

            return trim(
                $response->json(
                    'choices.0.message.content'
                ) ?? ''
            );
        } catch (\Throwable $e) {
            Log::warning(
                'Groq invitation intro exception',
                [
                    'message' => $e->getMessage(),
                ]
            );

            return null;
        }
    }

    /**
     * Chat NEXUS AI.
     *
     * Peut recevoir :
     * - le message utilisateur ;
     * - l'historique de conversation ;
     * - le texte extrait d'un document ;
     * - le nom du document.
     */
    public function chat(
    string $message,
    array $history = [],
    ?string $documentText = null
): ?string {
    try {
        $messages = [
            [
                'role' => 'system',
                'content' => <<<'PROMPT'
Tu es NEXUS AI, l'assistant intelligent de la plateforme NEXUS AI.

Ton domaine est exclusivement la gestion d'entreprise et la gestion de projets informatiques.

Tu aides principalement les chefs de projet avec :

- la gestion des projets informatiques ;
- la planification des projets ;
- la répartition des tâches ;
- l'organisation et la gestion des équipes ;
- la priorisation des tâches ;
- l'estimation et le suivi de l'effort ;
- l'analyse des risques ;
- le suivi de l'avancement des projets ;
- l'identification des problèmes dans un projet ;
- l'amélioration de la productivité des équipes ;
- l'aide à la prise de décision ;
- l'analyse des performances ;
- la gestion opérationnelle d'une entreprise.

RÈGLES IMPORTANTES :

1. Réponds toujours en français.
2. Sois professionnel, clair et concret.
3. Donne des recommandations directement applicables.
4. Ne prétends jamais connaître des données auxquelles tu n'as pas accès.
5. N'invente jamais de membres, projets, tâches, chiffres ou statistiques.
6. Si une information manque, indique clairement qu'elle manque.
7. Pour les questions concernant la répartition des tâches, propose une organisation logique selon les compétences, la charge et les priorités fournies.
8. Pour les questions concernant les risques, explique les causes possibles et propose des actions préventives.
9. Tu n'es pas un assistant généraliste.
10. Si la question n'a aucun rapport avec la gestion d'entreprise, les projets, les équipes ou les tâches, explique poliment que ton rôle est limité au domaine de NEXUS AI.

GESTION DES DOCUMENTS :

Lorsqu'un document est fourni dans le contexte de la conversation, considère son contenu comme une source d'information fournie par l'utilisateur.

Tu peux :
- analyser son contenu ;
- résumer ses informations ;
- identifier les objectifs ;
- identifier les acteurs ;
- identifier les tâches ;
- identifier les contraintes ;
- analyser les risques ;
- proposer une organisation ;
- estimer les charges lorsque les données nécessaires sont présentes ;
- répondre aux questions de l'utilisateur en te basant sur le document.

Ne dis jamais que tu ne peux pas lire le document si son contenu est présent dans ton contexte.

Si une information demandée n'existe pas dans le document, indique clairement qu'elle n'est pas précisée.

Les informations provenant du document doivent être distinguées des informations générales que tu proposes.

Réponds de manière naturelle et conversationnelle.
PROMPT
            ],
        ];

        // Historique de conversation
        foreach ($history as $item) {
            if (
                isset($item['role'], $item['content']) &&
                in_array(
                    $item['role'],
                    ['user', 'assistant'],
                    true
                )
            ) {
                $messages[] = [
                    'role' => $item['role'],
                    'content' => $item['content'],
                ];
            }
        }

        // Ajouter le document s'il existe
        if (
            $documentText !== null &&
            trim($documentText) !== ''
        ) {
            $messages[] = [
                'role' => 'system',
                'content' =>
                    "DOCUMENT FOURNI PAR L'UTILISATEUR\n\n"
                    . $documentText,
            ];
        }

        // Message actuel
        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        $response = Http::timeout(60)
            ->withToken(config('services.groq.key'))
            ->acceptJson()
            ->post(
                'https://api.groq.com/openai/v1/chat/completions',
                [
                    'model' => config('services.groq.model'),
                    'temperature' => 0.4,
                    'messages' => $messages,
                ]
            );

        if ($response->failed()) {
            Log::error('NEXUS AI chat error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        return trim(
            $response->json(
                'choices.0.message.content'
            ) ?? ''
        );

    } catch (\Throwable $e) {
        Log::error('NEXUS AI chat exception', [
            'message' => $e->getMessage(),
        ]);

        return null;
    }
}
}