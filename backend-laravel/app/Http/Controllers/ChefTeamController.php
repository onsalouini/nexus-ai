<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ChefTeamController extends Controller
{
    private const COLUMNS = [
        'id', 'first_name', 'last_name', 'email', 'role', 'job_title',
        'avatar_path', 'phone', 'weekly_capacity',
    ];

    private function ownMember(Request $request, User $member): User
    {
        abort_if($member->manager_id !== $request->user()->id, 403, 'Ce membre ne fait pas partie de votre équipe.');
        return $member;
    }

    public function index(Request $request)
    {
        $members = $request->user()->teamMembers()
            ->select(self::COLUMNS)
            ->withCount([
                'tasks as open_tasks_count' => fn ($q) => $q->where('status', '!=', 'done'),
                'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
            ])
            ->orderBy('first_name')
            ->get();

        return response()->json(['members' => $members]);
    }

    /** CRUD membre : création directe (mot de passe temporaire). */
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'job_title' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|in:membre_equipe,agent_support',
            'weekly_capacity' => 'nullable|integer|min:1|max:80',
            'password' => 'nullable|string|min:8',
        ]);

        $chef = $request->user();
        abort_if(is_null($chef->company_id), 422, "Configurez d'abord votre entreprise.");

        $temporary = $data['password'] ?? Str::password(10, symbols: false);

        $member = User::create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'job_title' => $data['job_title'] ?? null,
            'phone' => $data['phone'] ?? null,
            'weekly_capacity' => $data['weekly_capacity'] ?? 40,
            'role' => $data['role'] ?? 'membre_equipe',
            'password' => $temporary,
            'company_id' => $chef->company_id,
            'manager_id' => $chef->id,
        ]);

        return response()->json([
            'member' => $member->only(self::COLUMNS),
            'temporary_password' => isset($data['password']) ? null : $temporary,
        ], 201);
    }

    public function update(Request $request, User $member)
    {
        $this->ownMember($request, $member);

        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|email|unique:users,email,' . $member->id,
            'job_title' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'weekly_capacity' => 'nullable|integer|min:1|max:80',
        ]);

        $member->update($data);

        return response()->json(['member' => $member->only(self::COLUMNS)]);
    }

    /** Retire le membre de l'équipe du chef (le compte est conservé, ses tâches sont libérées). */
    public function destroy(Request $request, User $member)
    {
        $this->ownMember($request, $member);

        $member->tasks()
            ->whereHas('project', fn ($q) => $q->where('chef_de_projet_id', $request->user()->id))
            ->update(['assigned_to' => null]);
        $member->projects()->detach(
            $request->user()->projectsManaged()->pluck('id')
        );
        $member->teams()->where('chef_id', $request->user()->id)->detach();
        $member->update(['manager_id' => null]);

        return response()->json(['message' => 'Membre retiré de votre équipe.']);
    }
}
