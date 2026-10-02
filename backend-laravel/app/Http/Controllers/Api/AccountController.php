<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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

    public function updateAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $user = $request->user();

        if ($user->avatar_path) Storage::disk('public')->delete($user->avatar_path);
        $user->update(['avatar_path' => $request->file('avatar')->store('avatars', 'public')]);

        return response()->json(['user' => $this->payload($user->fresh())]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.', 'errors' => ['current_password' => ['Mot de passe actuel incorrect.']]], 422);
        }

        $user->update(['password' => $data['password']]);
        return response()->json(['message' => 'Mot de passe mis à jour.']);
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

        return response()->json(['user' => $this->payload($user->fresh())]);
    }
}
