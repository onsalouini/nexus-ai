<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIConversation;
use App\Models\AIAttachment;
use Illuminate\Http\Request;
use Smalot\PdfParser\Parser;

class AIAttachmentController extends Controller
{
    /**
     * Upload et analyse initiale d'un document PDF
     */
    public function store(
        Request $request,
        AIConversation $conversation
    ) {
        // Vérifier que la conversation appartient
        // à l'utilisateur connecté.
        if ($conversation->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Accès non autorisé.'
            ], 403);
        }

        // Validation du fichier
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:pdf',
                'max:10240',
            ],
        ]);

        $file = $validated['file'];

        try {
            // 1. Stocker le PDF
            $path = $file->store(
                'ai-documents',
                'public'
            );

            // 2. Extraire le texte du PDF
            $parser = new Parser();

            $pdf = $parser->parseFile(
                storage_path('app/public/' . $path)
            );

            $extractedText = $pdf->getText();

            // Nettoyage du texte
            $extractedText = trim(
                preg_replace('/\s+/', ' ', $extractedText)
            );

            // 3. Enregistrer le document en base
            $attachment = AIAttachment::create([
                'conversation_id' => $conversation->id,
                'message_id' => null,
                'user_id' => $request->user()->id,
                'original_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'extracted_text' => $extractedText,
            ]);

            // 4. Mettre à jour la conversation
            $conversation->touch();

            return response()->json([
                'message' => 'PDF uploadé et analysé avec succès.',
                'attachment' => $attachment,
                'text_length' => mb_strlen($extractedText),
            ], 201);

        } catch (\Throwable $e) {

            return response()->json([
                'message' => 'Impossible d’analyser le PDF.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}