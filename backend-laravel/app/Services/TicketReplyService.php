<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/*
| Brouillon de réponse à un ticket : Groq rédige une réponse dans la langue du client
| à partir du ticket et de l'historique ; sans IA, un modèle de réponse par catégorie.
*/
class TicketReplyService
{
    public function suggest(Ticket $ticket, User $agent): string
    {
        return $this->withGroq($ticket, $agent) ?? $this->template($ticket, $agent);
    }

    private function withGroq(Ticket $ticket, User $agent): ?string
    {
        $key = config('services.groq.key');
        if (! $key || app()->runningUnitTests()) {
            return null;
        }

        $history = $ticket->messages
            ->map(fn ($m) => ($m->author?->role === 'client' ? 'Client' : 'Agent') . ': ' . $m->body)
            ->implode("\n");

        try {
            $response = Http::withToken($key)->timeout(20)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model'),
                'temperature' => 0.4,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a polite, concise customer support agent for the NEXUS AI platform. '
                        . 'Write the reply in the SAME language as the customer message (French, English or Arabic). '
                        . 'Acknowledge the problem, give concrete next steps, never invent facts or promises of dates. '
                        . "Sign with the agent's first name. Plain text, max 120 words."],
                    ['role' => 'user', 'content' => "Ticket category: {$ticket->category}, urgency: {$ticket->urgency}.\n"
                        . "Title: {$ticket->title}\nMessage: {$ticket->description}\n"
                        . ($history ? "Conversation so far:\n{$history}\n" : '')
                        . "Agent first name: {$agent->first_name}"],
                ],
            ]);

            $text = trim((string) $response->json('choices.0.message.content'));

            return $text !== '' ? $text : null;
        } catch (\Throwable $e) {
            Log::warning('Suggestion de réponse Groq indisponible', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function template(Ticket $ticket, User $agent): string
    {
        $name = $ticket->creator?->first_name ?: $ticket->customer_name;
        $body = match ($ticket->category) {
            'bug' => __("Merci pour votre signalement. Notre équipe technique analyse le problème « :title ». Pourriez-vous nous indiquer les étapes pour le reproduire et, si possible, une capture d'écran ?", ['title' => $ticket->title]),
            'billing' => __('Merci pour votre message. Nous vérifions votre facturation et revenons vers vous avec le détail des montants concernés.'),
            'account' => __("Merci pour votre message. Nous vérifions l'accès à votre compte ; en attendant, essayez de réinitialiser votre mot de passe depuis la page de connexion."),
            'feature' => __('Merci pour cette suggestion ! Nous la transmettons à l\'équipe produit, qui étudie chaque demande pour les prochaines versions.'),
            default => __('Merci pour votre message. Nous l\'avons bien reçu et revenons vers vous rapidement.'),
        };

        return trim(($name ? __('Bonjour :name,', ['name' => $name]) : __('Bonjour,')) . "\n\n" . $body . "\n\n" . __('Cordialement,') . "\n" . $agent->first_name);
    }
}
