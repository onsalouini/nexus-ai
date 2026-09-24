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

    /*
    |--------------------------------------------------------------------------
    | Test du modèle IA sans créer de projet
    |--------------------------------------------------------------------------
    */

    public function testPrediction(Request $request, RiskPredictionService $riskPredictionService)
    {
        $validated = $request->validate([
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

        $adjustment = $validated['adjustment'] ?? 1;

        $prediction = $riskPredictionService->predict([
            ...$validated,
            'adjustment' => $adjustment,
        ]);

        if (!$prediction) {
            return response()->json([
                'message' => 'Le service de prédiction est indisponible.',
            ], 502);
        }

        return response()->json([
            'input' => [...$validated, 'adjustment' => $adjustment],
            'prediction' => $prediction,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Statut du service de prédiction (page "Modèles IA")
    |--------------------------------------------------------------------------
    */

    public function modelStatus(RiskPredictionService $riskPredictionService)
    {
        return response()->json([
            'online' => $riskPredictionService->isOnline(),
        ]);
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

            'risk_score' => isset($prediction['gap_percent'])
                ? (int) round($prediction['gap_percent'])
                : null,

            'risk_explanation' => $prediction['explanation'] ?? null,
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

    /*
    |--------------------------------------------------------------------------
    | Liste des prédictions de risque (pour la page dédiée du sidebar)
    |--------------------------------------------------------------------------
    */

    public function riskPredictions(Request $request)
    {
        $projects = Project::where('chef_de_projet_id', $request->user()->id)
            ->whereNotNull('predicted_effort')
            ->latest()
            ->get([
                'id',
                'name',
                'planned_effort',
                'predicted_effort',
                'risk_level',
                'risk_score',
                'created_at',
            ]);

        return response()->json($projects->map(fn ($project) => [
            'id' => $project->id,
            'name' => $project->name,
            'planned_effort' => $project->planned_effort,
            'predicted_effort' => $project->predicted_effort,
            'risk_level' => $project->risk_level,
            'gap_percent' => $project->risk_score,
            'created_at' => $project->created_at,
        ]));
    }

    public function generateReport(
        Request $request,
        Project $project,
        AIReportService $aiReportService,
        RiskPredictionService $riskPredictionService
    ) {
        $user = $request->user();

        // Le chef de projet propriétaire OU la direction de la même entreprise.
        $isOwner = $project->chef_de_projet_id === $user->id;

        $isDirector = $user->role === 'direction'
            && $user->company_id !== null
            && $project->company_id === $user->company_id;

        abort_unless($isOwner || $isDirector, 403);

        /*
        | Prédiction absente, ou explication jamais calculée (projets créés avant
        | cette fonctionnalité) : on interroge de nouveau le modèle pour que le
        | bilan soit toujours cohérent avec les chiffres affichés.
        */
        if (is_null($project->predicted_effort) || empty($project->risk_explanation)) {
            $prediction = $riskPredictionService->predict([
                'team_exp' => $project->team_exp,
                'manager_exp' => $project->manager_exp,
                'length' => $project->length,
                'transactions' => $project->transactions,
                'entities' => $project->entities,
                'points_non_adjust' => $project->points_non_adjust,
                'adjustment' => $project->adjustment,
                'language' => $project->language,
                'planned_effort' => $project->planned_effort,
            ]);

            if ($prediction) {
                $project->update([
                    'predicted_effort' => $prediction['predicted_effort_hours'] ?? null,
                    'risk_level' => $prediction['risk_level'] ?? null,
                    'risk_score' => isset($prediction['gap_percent'])
                        ? (int) round($prediction['gap_percent'])
                        : null,
                    'risk_explanation' => $prediction['explanation'] ?? null,
                ]);
            }
        }

        if (is_null($project->predicted_effort)) {
            return response()->json([
                'message' => 'La prédiction ML n\'est pas encore disponible pour ce projet.'
            ], 422);
        }

        if (is_null($project->risk_score)) {
            return response()->json([
                'message' => 'L\'écart de risque n\'est pas disponible pour ce projet.'
            ], 422);
        }

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
            'gap_percent' => $project->risk_score,

            'risk_explanation' => $project->risk_explanation,
        ]);

        if (!$report) {
            return response()->json([
                'message' => 'Impossible de générer le bilan AI.'
            ], 502);
        }

        // Sauvegarde du bilan en base
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
