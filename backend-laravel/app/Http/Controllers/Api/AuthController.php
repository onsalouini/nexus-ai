<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
{
    $validated = $request->validate([
        'first_name' => 'required|string|max:100',
        'last_name'  => 'required|string|max:100',
        'email'      => 'required|email|unique:users,email',
        'password'   => 'required|string|min:8|confirmed',
        'invitation_token' => 'nullable|string',
    ]);

    $invitation = null;
    if (!empty($validated['invitation_token'])) {
        $invitation = \App\Models\Invitation::where('token', $validated['invitation_token'])->first();
        if (!$invitation || !$invitation->isValid()) {
            return response()->json(['message' => 'Invitation invalide ou expirée.'], 422);
        }
    }

    $user = User::create([
        'first_name' => $validated['first_name'],
        'last_name'  => $validated['last_name'],
        'email'      => $validated['email'],
        'password'   => Hash::make($validated['password']),
        'role'       => $invitation->role ?? 'direction',
        'company_id' => $invitation->company_id ?? null,
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
}
