<?php

namespace App\Http\Controllers\Api;
use App\Services\VerificationCodeService;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\AuditLog;
use App\Services\TotpService;

class AuthController extends Controller
{
    public function sendVerificationCode(Request $request, VerificationCodeService $codeService)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'first_name' => 'nullable|string|max:100',
    ]);

    if (User::where('email', $validated['email'])->exists()) {
        return response()->json(['message' => __('Un compte existe déjà avec cet email.')], 422);
    }

    $codeService->generateAndSend($validated['email'], $validated['first_name'] ?? '');

    return response()->json(['message' => __('Code envoyé.')]);
}
    public function register(Request $request, VerificationCodeService $codeService)
{
    $validated = $request->validate([
    'first_name' => 'required|string|max:100',
    'last_name'  => 'required|string|max:100',
    'email'      => 'required|email|unique:users,email',
    'password'   => 'required|string|min:8|confirmed',
    'invitation_token' => 'nullable|string',
    'avatar' => 'nullable|image|max:2048',
    'cv' => 'nullable|mimes:pdf|max:5120',
]);

if (!$codeService->isEmailRecentlyVerified($validated['email'])) {
    return response()->json(['message' => __('Email non vérifié. Recommencez la vérification.')], 422);
}

    $invitation = null;
    if (!empty($validated['invitation_token'])) {
        $invitation = \App\Models\Invitation::where('token', $validated['invitation_token'])->first();
        if (!$invitation || !$invitation->isValid()) {
            return response()->json(['message' => __('Invitation invalide ou expirée.')], 422);
        }
    }

    $avatarPath = $request->hasFile('avatar') ? $request->file('avatar')->store('avatars', 'public') : null;
    $cvPath = $request->hasFile('cv') ? $request->file('cv')->store('cvs', 'public') : null;

    $user = User::create([
        'first_name' => $validated['first_name'],
        'last_name'  => $validated['last_name'],
        'email'      => $validated['email'],
        'password'   => Hash::make($validated['password']),
        'role'       => $invitation->role ?? 'direction',
        'company_id' => $invitation->company_id ?? null,
        'manager_id' => $invitation?->invited_by,
        'avatar_path' => $avatarPath,
        'cv_path' => $cvPath,
        'email_verified_at' => now(),
        'job_title' => $invitation?->job_title,
        'locale' => $invitation?->locale ?? app()->getLocale(),
    ]);

    if ($invitation) {
        $invitation->update(['accepted_at' => now()]);

        // Le membre invité sur un projet précis y est affecté directement
        if ($invitation->project_id) {
            $user->projects()->syncWithoutDetaching([$invitation->project_id]);
        }
    }

    AuditLog::record($user, $invitation ? 'invitation.accepted' : 'auth.registered', ['email' => $user->email]);

    $token = $user->createToken('nexus-ai')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user,
        'needs_company_setup' => is_null($user->company_id),
    ], 201);
}

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            if ($user) {
                AuditLog::record($user, 'auth.login_failed', [], $request);
            }
            return response()->json(['message' => __('Identifiants incorrects.')], 401);
        }

        // Double authentification : pas de token tant que le code TOTP n'est pas validé
        if ($user->two_factor_enabled) {
            $challenge = Str::random(64);
            Cache::put('2fa:' . $challenge, $user->id, now()->addMinutes(5));

            return response()->json([
                'two_factor_required' => true,
                'challenge' => $challenge,
            ]);
        }

        return $this->issueToken($user, $request);
    }

    /** Second facteur : valide le code TOTP lié au challenge reçu au login. */
    public function verifyTwoFactor(Request $request, TotpService $totp)
    {
        $data = $request->validate([
            'challenge' => 'required|string',
            'code' => 'required|string',
        ]);

        $userId = Cache::get('2fa:' . $data['challenge']);
        $user = $userId ? User::find($userId) : null;

        if (! $user || ! $user->two_factor_secret) {
            return response()->json(['message' => __('Session de connexion expirée. Reconnectez-vous.')], 422);
        }

        if (! $totp->verify($user->two_factor_secret, $data['code'])) {
            AuditLog::record($user, 'auth.2fa_failed', [], $request);
            return response()->json(['message' => __('Code de vérification invalide.')], 422);
        }

        Cache::forget('2fa:' . $data['challenge']);

        return $this->issueToken($user, $request);
    }

    private function issueToken(User $user, Request $request)
    {
        $token = $user->createToken('nexus-ai')->plainTextToken;
        AuditLog::record($user, 'auth.login', [], $request);

        return response()->json([
            'token' => $token,
            'user' => $user,
            'needs_company_setup' => is_null($user->company_id),
        ]);
    }

    public function logout(Request $request)
    {
        AuditLog::record($request->user(), 'auth.logout', [], $request);
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => __('Deconnecte')]);
    }

    public function setupCompany(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'industry' => 'nullable|string',
            'employees_count' => 'nullable|integer',
        ]);

        $company = Company::create($validated);
        $request->user()->update(['company_id' => $company->id]);
        AuditLog::record($request->user()->fresh(), 'company.created', ['name' => $company->name], $request);

        return response()->json(['company' => $company]);
    }
    public function verifyCode(Request $request, VerificationCodeService $codeService)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'code' => 'required|string|size:6',
    ]);

    if (!$codeService->verify($validated['email'], $validated['code'])) {
        return response()->json(['message' => __('Code incorrect ou expiré.')], 422);
    }

    return response()->json(['verified' => true]);
}
}
