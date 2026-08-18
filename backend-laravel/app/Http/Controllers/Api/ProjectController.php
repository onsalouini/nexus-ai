<?php

namespace App\Http\Controllers\Api;
use App\Services\RiskPredictionService;
use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Services\AIReportService;
class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = Project::where('chef_de_projet_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request, RiskPredictionService $riskPredictionService)
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
        return response()->json([
            'message' => 'Configurez d\'abord votre entreprise.'
        ], 422);
    }

    $adjustment = $validated['adjustment'] ?? 1;

    /*
    |--------------------------------------------------------------------------
    | 1. Création du projet
    |--------------------------------------------------------------------------
    */

    $project = Project::create([
        ...$validated,

        'adjustment' => $adjustment,

        'points_adjust' =>
            $validated['points_non_adjust'] * $adjustment,

        'company_id' => $user->company_id,

        'chef_de_projet_id' => $user->id,
    ]);

    /*
    |--------------------------------------------------------------------------
    | 2. Appel du modèle IA
    |--------------------------------------------------------------------------
    */

    $prediction = $riskPredictionService->predict([
        'team_exp' => $validated['team_exp'],
        'manager_exp' => $validated['manager_exp'],
        'length' => $validated['length'],
        'transactions' => $validated['transactions'],
        'entities' => $validated['entities'],
        'points_non_adjust' => $validated['points_non_adjust'],
        'adjustment' => $adjustment,
        'language' => $validated['language'],
        'planned_effort' => $validated['planned_effort'],
    ]);

    /*
    |--------------------------------------------------------------------------
    | 3. Sauvegarde du résultat IA
    |--------------------------------------------------------------------------
    */

    if ($prediction) {
        $project->update([
            'predicted_effort' =>
                $prediction['predicted_effort_hours'] ?? null,

            'risk_level' =>
                $prediction['risk_level'] ?? null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Retour de la réponse
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'project' => $project->fresh(),
        'ai_analysis' => $prediction,
    ], 201);
}

    public function show(Request $request, Project $project)
    {
        abort_if($project->chef_de_projet_id !== $request->user()->id, 403);
        return response()->json($project);
    }
    public function generateReport(
    Request $request,
    Project $project,
    AIReportService $aiReportService
) {
    abort_if(
        $project->chef_de_projet_id !== $request->user()->id,
        403
    );

    if (is_null($project->predicted_effort)) {
        return response()->json([
            'message' => 'La prédiction ML n’est pas encore disponible pour ce projet.'
        ], 422);
    }

    if (is_null($project->planned_effort) || $project->planned_effort <= 0) {
        return response()->json([
            'message' => 'L’effort planifié du projet est invalide.'
        ], 422);
    }

    $gapPercent = (
        ($project->predicted_effort - $project->planned_effort)
        / $project->planned_effort
    ) * 100;

    $report = $aiReportService->generate([
        'name' => $project->name,
        'description' => $project->description,

        'team_exp' => $project->team_exp,
        'manager_exp' => $project->manager_exp,
        'length' => $project->length,
        'transactions' => $project->transactions,
        'entities' => $project->entities,
        'points_non_adjust' => $project->points_non_adjust,
        'adjustment' => $project->adjustment,
        'language' => $project->language,

        'planned_effort' => $project->planned_effort,
        'predicted_effort' => $project->predicted_effort,
        'risk_level' => $project->risk_level,
        'gap_percent' => round($gapPercent, 2),
    ]);

   if (!$report) {
    return response()->json([
        'message' => 'Impossible de générer le bilan AI.'
    ], 502);
}

// Sauvegarder le bilan AI en base de données
$project->update([
    'ai_report' => $report,
    'ai_report_generated_at' => now(),
]);

return response()->json([
    'project' => $project->fresh(),
    'report' => $report,
]);
}
}
