<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\Invitation;
use Illuminate\Http\Request;

use Illuminate\Support\Str;
use App\Services\BrevoMailService;
class InvitationController extends Controller
{
    // Direction invite un chef de projet (ou autre role interne)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'first_name' => 'nullable|string|max:100',
            'role' => 'required|in:chef_de_projet,agent_support',
        ]);

        $user = $request->user();

        if (is_null($user->company_id)) {
            return response()->json(['message' => 'Configurez d\'abord votre entreprise.'], 422);
        }

        $invitation = Invitation::create([
            ...$validated,
            'token' => Str::random(48),
            'company_id' => $user->company_id,
            'invited_by' => $user->id,
            'expires_at' => now()->addDays(7),
        ]);

       $link = rtrim(config('app.frontend_url'), '/') . '/invitation?token=' . $invitation->token;

$intro = app(\App\Services\GroqService::class)->generateInvitationIntro(
    $invitation->first_name ?? 'là',
    $invitation->role,
    $invitation->company->name ?? "l'entreprise"
) ?? "Vous avez été invité(e) à rejoindre votre espace de travail.";

$htmlContent = view('emails.invitation', [
    'link' => $link,
    'invitation' => $invitation,
    'intro' => $intro,
])->render();

try {
    app(BrevoMailService::class)->send(
        $invitation->email,
        'Invitation à rejoindre NEXUS AI',
        $htmlContent,
        $invitation->first_name
    );
} catch (\Throwable $e) {
    \Illuminate\Support\Facades\Log::error('Echec envoi invitation', ['error' => $e->getMessage()]);
    return response()->json([
        'message' => 'Invitation créée mais l\'email n\'a pas pu être envoyé.',
        'invitation' => $invitation,
    ], 500);
}

return response()->json(['message' => 'Invitation envoyée.', 'invitation' => $invitation], 201);
    }

    // Liste des invitations envoyees par l'entreprise (pour affichage dashboard)
    public function index(Request $request)
    {
        $invitations = Invitation::where('company_id', $request->user()->company_id)
            ->latest()
            ->get();

        return response()->json($invitations);
    }

    // Le frontend appelle ceci AVANT d'afficher le formulaire d'inscription
    public function validateToken(string $token)
    {
        $invitation = Invitation::where('token', $token)->first();

        if (! $invitation || ! $invitation->isValid()) {
            return response()->json(['valid' => false], 404);
        }

        return response()->json([
            'valid' => true,
            'email' => $invitation->email,
            'first_name' => $invitation->first_name,
            'role' => $invitation->role,
        ]);
    }
}
