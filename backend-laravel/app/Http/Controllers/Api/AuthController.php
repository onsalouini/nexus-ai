<?php

namespace App\Http\Controllers\Api;
use App\Services\VerificationCodeService;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function sendVerificationCode(Request $request, VerificationCodeService $codeService)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'first_name' => 'nullable|string|max:100',
    ]);

    if (User::where('email', $validated['email'])->exists()) {
        return response()->json(['message' => 'Un compte existe déjà avec cet email.'], 422);
    }

    $codeService->generateAndSend($validated['email'], $validated['first_name'] ?? '');

    return response()->json(['message' => 'Code envoyé.']);
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
    return response()->json(['message' => 'Email non vérifié. Recommencez la vérification.'], 422);
}

    $invitation = null;
    if (!empty($validated['invitation_token'])) {
        $invitation = \App\Models\Invitation::where('token', $validated['invitation_token'])->first();
        if (!$invitation || !$invitation->isValid()) {
            return response()->json(['message' => 'Invitation invalide ou expirée.'], 422);
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
    ]);

    if ($invitation) {
        $invitation->update(['accepted_at' => now()]);
    }

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
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        $token = $user->createToken('nexus-ai')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
             'needs_company_setup' => is_null($user->company_id),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Deconnecte']);
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

        return response()->json(['company' => $company]);
    }
    public function verifyCode(Request $request, VerificationCodeService $codeService)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'code' => 'required|string|size:6',
    ]);

    if (!$codeService->verify($validated['email'], $validated['code'])) {
        return response()->json(['message' => 'Code incorrect ou expiré.'], 422);
    }

    return response()->json(['verified' => true]);
}
}
