<?php

namespace App\Http\Controllers;

use App\Services\GroqService;
use Illuminate\Http\Request;

class AIChatController extends Controller
{
    public function chat(Request $request, GroqService $groqService)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
        ]);

        $reply = $groqService->chat(
            $validated['message'],
            $validated['history'] ?? []
        );

        if ($reply === null) {
            return response()->json([
                'message' => 'NEXUS AI est temporairement indisponible.'
            ], 503);
        }

        return response()->json([
            'reply' => $reply,
        ]);
    }
}