<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    public function generateInvitationIntro(string $firstName, string $role, string $companyName): ?string
    {
        $roleLabel = match ($role) {
            'chef_de_projet' => 'chef de projet',
            'agent_support' => 'agent support',
            default => $role,
        };

        try {
            $response = Http::withToken(config('services.groq.key'))
                ->timeout(6)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => config('services.groq.model'),
                    'messages' => [
                        ['role' => 'system', 'content' => 'Tu ecris une seule phrase courte, chaleureuse et professionnelle en francais pour introduire un email d\'invitation. Pas de guillemets, pas de signature, une seule phrase.'],
                        ['role' => 'user', 'content' => "Prenom: {$firstName} | Role propose: {$roleLabel} | Entreprise: {$companyName}"],
                    ],
                    'max_tokens' => 60,
                    'temperature' => 0.7,
                ]);

            if ($response->failed()) {
                Log::warning('Groq invitation intro failed', ['status' => $response->status()]);
                return null;
            }

            return trim($response->json('choices.0.message.content'));
        } catch (\Throwable $e) {
            Log::warning('Groq invitation intro exception', ['message' => $e->getMessage()]);
            return null; // le mail part quand meme, juste sans la phrase generee
        }
    }
}