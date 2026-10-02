<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    private function own(Request $request, Team $team): Team
    {
        abort_if($team->chef_id !== $request->user()->id, 403);
        return $team;
    }

    private function syncMembers(Request $request, Team $team, ?array $ids): void
    {
        if ($ids === null) return;
        $valid = $request->user()->teamMembers()->whereIn('id', $ids)->pluck('id')->all();
        $team->members()->sync($valid);
    }

    private function present(Team $team): Team
    {
        return $team->load('members:id,first_name,last_name,email,job_title,role')
            ->loadCount('projects');
    }

    public function index(Request $request)
    {
        $teams = Team::with('members:id,first_name,last_name,email,job_title,role')
            ->withCount('projects')
            ->where('chef_id', $request->user()->id)
            ->latest()->get();

        return response()->json(['teams' => $teams]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'description' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:20',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer',
        ]);

        abort_if(is_null($request->user()->company_id), 422, "Configurez d'abord votre entreprise.");

        $team = Team::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#22d3ee',
            'company_id' => $request->user()->company_id,
            'chef_id' => $request->user()->id,
        ]);
        $this->syncMembers($request, $team, $data['member_ids'] ?? []);

        return response()->json($this->present($team), 201);
    }

    public function update(Request $request, Team $team)
    {
        $this->own($request, $team);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:120',
            'description' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:20',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer',
        ]);

        $team->update(collect($data)->except('member_ids')->all());
        $this->syncMembers($request, $team, $data['member_ids'] ?? null);

        return response()->json($this->present($team));
    }

    public function destroy(Request $request, Team $team)
    {
        $this->own($request, $team);
        $team->projects()->update(['team_id' => null]);
        $team->delete();
        return response()->json(['message' => 'Équipe supprimée.']);
    }
}
