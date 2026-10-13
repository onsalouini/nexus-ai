<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class DirectorProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => __('Utilisateur non authentifié.')
            ], 401);
        }

        if (!$user->company_id) {
            return response()->json([
                'message' => __('Aucune entreprise associée à cet utilisateur.')
            ], 422);
        }

        $projects = Project::where('company_id', $user->company_id)
            ->with([
                'chefDeProjet:id,first_name,last_name,email,job_title,avatar_path,avatar_color',
                'team:id,first_name,last_name,email,job_title,avatar_path,avatar_color',
            ])
            ->latest()
            ->get();

        return response()->json($projects);
    }

    public function show(Request $request, Project $project)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => __('Utilisateur non authentifié.')
            ], 401);
        }

        if ($project->company_id !== $user->company_id) {
            return response()->json([
                'message' => __('Accès non autorisé.')
            ], 403);
        }

        $project->load([
            'chefDeProjet:id,first_name,last_name,email,job_title,avatar_path,avatar_color',
            'team:id,first_name,last_name,email,job_title,avatar_path,avatar_color',
            'company',
        ]);

        return response()->json($project);
    }
}