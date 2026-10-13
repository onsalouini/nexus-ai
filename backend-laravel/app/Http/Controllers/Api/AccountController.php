<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Http\Middleware\SetLocaleFromHeader;
use App\Models\AuditLog;
use App\Models\UserAvatar;
use App\Services\AvatarService;
use App\Services\TotpService;

class AccountController extends Controller
{
    private function payload($user): array
    {
        $user->load('company');
        return $user->toArray();
    }

    public function show(Request $request)
    {
        return response()->json(['user' => $this->payload($request->user())]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'job_title' => 'nullable|string|max:100',
            'bio' => 'nullable|string|max:500',
            'weekly_capacity' => 'nullable|integer|min:1|max:80',
        ]);
        $user->update($data);

        return response()->json(['user' => $this->payload($user->fresh())]);
    }

    public function updateAvatar(Request $request, AvatarService $avatars)
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $user = $request->user();
        $avatars->store($user, $request->file('avatar'));

        return response()->json(['user' => $this->payload($user->fresh())]);
    }

    /** Supprime la photo : l'avatar affiche alors les initiales sur la couleur choisie. */
    public function removeAvatar(Request $request, AvatarService $avatars)
    {
        $data = $request->validate(['avatar_color' => ['nullable', Rule::in(AvatarService::COLORS)]]);
        $user = $request->user();
        $avatars->remove($user);
        if (array_key_exists('avatar_color', $data)) {
            $user->update(['avatar_color' => $data['avatar_color']]);
        }

        return response()->json(['user' => $this->payload($user->fresh())]);
    }

    /** Photo servie depuis la base (route publique : utilisée dans des balises <img>). */
    public function avatar(int $userId)
    {
        $avatar = UserAvatar::find($userId);
        abort_unless($avatar, 404);

        return response($avatar->data, 200, [
            'Content-Type' => $avatar->mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    /** Préférences : couleur des initiales, alertes par email. */
    public function updatePreferences(Request $request)
    {
        $data = $request->validate([
            'avatar_color' => ['sometimes', 'nullable', Rule::in(AvatarService::COLORS)],
            'email_alerts' => 'sometimes|boolean',
        ]);
        $request->user()->update($data);

        return response()->json(['user' => $this->payload($request->user()->fresh())]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => __('Mot de passe actuel incorrect.'), 'errors' => ['current_password' => [__('Mot de passe actuel incorrect.')]]], 422);
        }

        $user->update(['password' => $data['password']]);
        AuditLog::record($user, 'account.password_changed', [], $request);
        return response()->json(['message' => __('Mot de passe mis à jour.')]);
    }

    /** Paramètres de l'entreprise (direction uniquement). */
    public function updateCompany(Request $request)
    {
        $user = $request->user();
        abort_unless($user->role === 'direction' && $user->company, 403, 'Réservé à la direction.');

        $data = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:100',
            'employees_count' => 'nullable|integer|min:0',
        ]);
        $user->company->update($data);
        AuditLog::record($user, 'company.updated', ['name' => $data['name']], $request);

        return response()->json(['user' => $this->payload($user->fresh())]);
    }

    /** Langue d'interface mémorisée sur le profil (suit l'utilisateur sur tous ses appareils). */
    public function updateLocale(Request $request)
    {
        $data = $request->validate([
            'locale' => ['required', Rule::in(SetLocaleFromHeader::SUPPORTED)],
        ]);
        $request->user()->update($data);

        return response()->json(['user' => $this->payload($request->user()->fresh())]);
    }

    /*
    |--------------------------------------------------------------------------
    | Double authentification (TOTP)
    |--------------------------------------------------------------------------
    | 1. setup  : génère un secret (non actif) et l'URI à scanner
    | 2. enable : active la 2FA après vérification d'un premier code
    | 3. disable: désactive avec mot de passe + code
    */
    public function setupTwoFactor(Request $request, TotpService $totp)
    {
        $user = $request->user();

        if ($user->two_factor_enabled) {
            return response()->json(['message' => __('La double authentification est déjà active.')], 422);
        }

        $secret = $totp->generateSecret();
        $user->update(['two_factor_secret' => $secret]);

        return response()->json([
            'secret' => $secret,
            'otpauth_uri' => $totp->otpauthUri($secret, $user->email),
        ]);
    }

    public function enableTwoFactor(Request $request, TotpService $totp)
    {
        $data = $request->validate(['code' => 'required|string']);
        $user = $request->user();

        if (! $user->two_factor_secret || ! $totp->verify($user->two_factor_secret, $data['code'])) {
            return response()->json(['message' => __('Code de vérification invalide.')], 422);
        }

        $user->update(['two_factor_enabled_at' => now()]);
        AuditLog::record($user, 'account.2fa_enabled', [], $request);

        return response()->json(['user' => $this->payload($user->fresh())]);
    }

    public function disableTwoFactor(Request $request, TotpService $totp)
    {
        $data = $request->validate([
            'password' => 'required|string',
            'code' => 'required|string',
        ]);
        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => __('Mot de passe actuel incorrect.')], 422);
        }
        if (! $user->two_factor_secret || ! $totp->verify($user->two_factor_secret, $data['code'])) {
            return response()->json(['message' => __('Code de vérification invalide.')], 422);
        }

        $user->update(['two_factor_secret' => null, 'two_factor_enabled_at' => null]);
        AuditLog::record($user, 'account.2fa_disabled', [], $request);

        return response()->json(['user' => $this->payload($user->fresh())]);
    }
}
