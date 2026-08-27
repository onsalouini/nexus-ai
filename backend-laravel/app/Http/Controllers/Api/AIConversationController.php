<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIConversation;
use Illuminate\Http\Request;

class AIConversationController extends Controller
{
    /**
     * Récupérer les conversations du Chef connecté
     */
    public function index(Request $request)
    {
        $conversations = $request->user()
            ->aiConversations()
            ->latest('updated_at')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Créer une nouvelle conversation
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $conversation = $request->user()
            ->aiConversations()
            ->create([
                'title' => $validated['title'] ?? 'Nouvelle conversation',
            ]);

        return response()->json($conversation, 201);
    }

    /**
     * Récupérer une conversation avec ses messages
     */
    public function show(
        Request $request,
        AIConversation $conversation
    ) {
        // Sécurité :
        // un utilisateur ne peut consulter que ses propres conversations.
        if ($conversation->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Accès non autorisé.'
            ], 403);
        }

        $conversation->load([
            'messages' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }
        ]);

        return response()->json($conversation);
    }
}