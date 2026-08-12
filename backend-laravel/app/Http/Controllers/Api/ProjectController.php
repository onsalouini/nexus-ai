<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = Project::where('chef_de_projet_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'team_exp' => 'required|numeric|min:0',
            'manager_exp' => 'required|numeric|min:0',
            'length' => 'required|numeric|min:1',
            'transactions' => 'required|numeric|min:0',
            'entities' => 'required|numeric|min:0',
            'points_non_adjust' => 'required|numeric|min:0',
            'adjustment' => 'nullable|numeric|min:0.5|max:1.5',
            'language' => 'required|integer',
            'planned_effort' => 'required|numeric|min:1',
        ]);

        $user = $request->user();

        if (is_null($user->company_id)) {
            return response()->json(['message' => 'Configurez d\'abord votre entreprise.'], 422);
        }

        $adjustment = $validated['adjustment'] ?? 1;

        $project = Project::create([
            ...$validated,
            'adjustment' => $adjustment,
            'points_adjust' => $validated['points_non_adjust'] * $adjustment,
            'company_id' => $user->company_id,
            'chef_de_projet_id' => $user->id,
        ]);

        // TODO (Module 2) : appeler ici le microservice risk-service pour
        // remplir predicted_effort / risk_score / risk_level automatiquement

        return response()->json(['project' => $project], 201);
    }

    public function show(Request $request, Project $project)
    {
        abort_if($project->chef_de_projet_id !== $request->user()->id, 403);
        return response()->json($project);
    }
}