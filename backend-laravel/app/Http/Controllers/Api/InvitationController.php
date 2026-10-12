<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SetLocaleFromHeader;
use App\Models\AuditLog;
use App\Models\Invitation;
use App\Services\BrevoMailService;
use App\Services\GroqService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InvitationController extends Controller
{
    private const VALIDITY_DAYS = 7;

    // Direction invite un chef de projet / agent / membre ; le chef invite ses membres
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'first_name' => 'nullable|string|max:100',
            'role' => 'required|in:chef_de_projet,agent_support,membre_equipe',
            'job_title' => 'nullable|string|max:100',
            'project_id' => 'nullable|exists:projects,id',
            'locale' => ['nullable', Rule::in(SetLocaleFromHeader::SUPPORTED)],
        ]);

        $user = $request->user();

        if (is_null($user->company_id)) {
            return response()->json(['message' => __('Configurez d\'abord votre entreprise.')], 422);
        }

        // Seule la direction peut inviter un chef de projet
        if ($user->role !== 'direction' && $validated['role'] === 'chef_de_projet') {
            return response()->json(['message' => __('Seule la direction peut inviter un chef de projet.')], 403);
        }

        $invitation = Invitation::create([
            ...$validated,
            'locale' => $validated['locale'] ?? App::getLocale(),
            'token' => Str::random(48),
            'company_id' => $user->company_id,
            'invited_by' => $user->id,
            'expires_at' => now()->addDays(self::VALIDITY_DAYS),
        ]);

        AuditLog::record($user, 'invitation.sent', ['email' => $invitation->email, 'role' => $invitation->role]);

        if (! $this->sendEmail($invitation)) {
            return response()->json([
                'message' => __('Invitation créée mais l\'email n\'a pas pu être envoyé.'),
                'invitation' => $invitation,
            ], 500);
        }

        return response()->json(['message' => __('Invitation envoyée.'), 'invitation' => $invitation], 201);
    }

    // Liste des invitations de l'entreprise, avec leur statut (en attente / acceptée / expirée)
    public function index(Request $request)
    {
        $invitations = Invitation::where('company_id', $request->user()->company_id)
            ->latest()
            ->get()
            ->map(fn (Invitation $i) => [
                ...$i->toArray(),
                'status' => $this->status($i),
            ]);

        return response()->json($invitations);
    }

    // Renvoie l'email avec un nouveau lien et une nouvelle date d'expiration
    public function resend(Request $request, Invitation $invitation)
    {
        $this->authorizeManage($request, $invitation);

        if ($invitation->accepted_at) {
            return response()->json(['message' => __('Cette invitation a déjà été acceptée.')], 422);
        }

        $invitation->update([
            'token' => Str::random(48),
            'expires_at' => now()->addDays(self::VALIDITY_DAYS),
        ]);

        AuditLog::record($request->user(), 'invitation.resent', ['email' => $invitation->email]);

        if (! $this->sendEmail($invitation)) {
            return response()->json(['message' => __('Invitation créée mais l\'email n\'a pas pu être envoyé.')], 500);
        }

        return response()->json([
            'message' => __('Invitation renvoyée.'),
            'invitation' => [...$invitation->fresh()->toArray(), 'status' => 'pending'],
        ]);
    }

    // Annule une invitation non acceptée (le lien devient invalide)
    public function destroy(Request $request, Invitation $invitation)
    {
        $this->authorizeManage($request, $invitation);

        if ($invitation->accepted_at) {
            return response()->json(['message' => __('Cette invitation a déjà été acceptée.')], 422);
        }

        AuditLog::record($request->user(), 'invitation.cancelled', ['email' => $invitation->email]);
        $invitation->delete();

        return response()->json(['message' => __('Invitation annulée.')]);
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
            'locale' => $invitation->locale,
        ]);
    }

    /** La direction gère toutes les invitations de l'entreprise, les autres seulement les leurs. */
    private function authorizeManage(Request $request, Invitation $invitation): void
    {
        $user = $request->user();
        abort_unless($invitation->company_id === $user->company_id, 403);
        abort_unless($user->role === 'direction' || $invitation->invited_by === $user->id, 403);
    }

    private function status(Invitation $invitation): string
    {
        if ($invitation->accepted_at) {
            return 'accepted';
        }

        return $invitation->expires_at->isPast() ? 'expired' : 'pending';
    }

    /** Envoie l'email d'invitation dans la langue choisie pour l'invité. */
    private function sendEmail(Invitation $invitation): bool
    {
        $previousLocale = App::getLocale();
        App::setLocale($invitation->locale ?: $previousLocale);

        try {
            $link = rtrim(config('app.frontend_url'), '/') . '/invitation?token=' . $invitation->token;

            $intro = app(GroqService::class)->generateInvitationIntro(
                $invitation->first_name ?? '',
                $invitation->role,
                $invitation->company->name ?? 'NEXUS AI'
            ) ?: __('Vous avez été invité(e) à rejoindre votre espace de travail.');

            $html = view('emails.invitation', [
                'link' => $link,
                'invitation' => $invitation,
                'intro' => $intro,
            ])->render();

            app(BrevoMailService::class)->send(
                $invitation->email,
                __('Invitation à rejoindre NEXUS AI'),
                $html,
                $invitation->first_name
            );

            return true;
        } catch (\Throwable $e) {
            Log::error('Echec envoi invitation', ['error' => $e->getMessage()]);

            return false;
        } finally {
            App::setLocale($previousLocale);
        }
    }
}
