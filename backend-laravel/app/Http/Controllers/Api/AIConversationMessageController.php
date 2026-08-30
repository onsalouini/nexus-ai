<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIConversation;
use App\Services\GroqService;
use Illuminate\Http\Request;

class AIConversationMessageController extends Controller
{
    /**
     * Envoyer un message dans une conversation
     * et obtenir la réponse de NEXUS AI.
     */
    public function store(
        Request $request,
        AIConversation $conversation,
        GroqService $groqService
    ) {
        // Vérifier que la conversation appartient
        // à l'utilisateur connecté.
        if ($conversation->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Accès non autorisé.'
            ], 403);
        }

        // Validation du message
        $validated = $request->validate([
            'content' => 'required|string|max:10000',
        ]);

        // 1. Récupérer l'historique AVANT le nouveau message
        $history = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'role' => $message->role,
                    'content' => $message->content,
                ];
            })
            ->toArray();

        // 2. Sauvegarder le message utilisateur
        $userMessage = $conversation->messages()->create([
            'role' => 'user',
            'content' => $validated['content'],
        ]);

        // 3. Récupérer le dernier document de la conversation
        $attachment = $conversation->attachments()
            ->latest()
            ->first();

        $documentText = null;

        if ($attachment !== null) {
            $documentText = $attachment->extracted_text;
        }

        // 4. Envoyer le message + historique + document à Groq
        $reply = $groqService->chat(
            $validated['content'],
            $history,
            $documentText
        );

        // 5. Vérifier si Groq répond
        if ($reply === null) {
            return response()->json([
                'message' => 'NEXUS AI est temporairement indisponible.',
                'user_message' => $userMessage,
            ], 503);
        }

        // 6. Sauvegarder la réponse de NEXUS AI
        $assistantMessage = $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $reply,
        ]);

        // 7. Mettre à jour la conversation
        $conversation->touch();

        return response()->json([
            'conversation_id' => $conversation->id,
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
        ]);
    }
}