<?php

namespace App\Http\Controllers\Api;
use App\Services\RiskPredictionService;
use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Services\AIReportService;
use App\Services\ProjectReportService;
use App\Models\AuditLog;
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
                'message' => __('Le service de prédiction est indisponible.'),
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
            'message' => __('Configurez d\'abord votre entreprise.')
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

    AuditLog::record($request->user(), 'project.created', ['project' => $project->name]);

    return response()->json([
        'project' => $project->fresh(),
        'ai_analysis' => $prediction,
    ], 201);
}

    public function update(Request $request, Project $project, RiskPredictionService $riskPredictionService)
    {
        abort_if($project->chef_de_projet_id !== $request->user()->id, 403);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:planifie,en_cours,termine,suspendu',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date|after_or_equal:start_date',
            'team_exp' => 'sometimes|numeric|min:0',
            'manager_exp' => 'sometimes|numeric|min:0',
            'length' => 'sometimes|numeric|min:1',
            'transactions' => 'sometimes|numeric|min:0',
            'entities' => 'sometimes|numeric|min:0',
            'points_non_adjust' => 'sometimes|numeric|min:0',
            'adjustment' => 'nullable|numeric|min:0.5|max:1.5',
            'language' => 'sometimes|integer',
            'planned_effort' => 'sometimes|numeric|min:1',
        ]);

        $modelInputs = ['team_exp','manager_exp','length','transactions','entities','points_non_adjust','adjustment','language','planned_effort'];
        $needsRecompute = count(array_intersect($modelInputs, array_keys($data))) > 0;

        $project->update($data);

        if ($needsRecompute) {
            $project->update(['points_adjust' => $project->points_non_adjust * ($project->adjustment ?: 1)]);
            $prediction = $riskPredictionService->predict(collect($project->only($modelInputs))->all());
            if ($prediction) {
                $project->update([
                    'predicted_effort' => $prediction['predicted_effort_hours'] ?? null,
                    'risk_level' => $prediction['risk_level'] ?? null,
                    'risk_score' => isset($prediction['gap_percent']) ? (int) round($prediction['gap_percent']) : null,
                    'risk_explanation' => $prediction['explanation'] ?? null,
                ]);
            }
        }

        \App\Models\ProjectActivity::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'type' => 'project_updated',
            'message' => __('Projet mis à jour'),
        ]);

        AuditLog::record($request->user(), 'project.updated', ['project' => $project->name]);

        /*
        | Bilan IA automatique : si le projet avait déjà un bilan et que les données
        | du modèle ont changé, on le régénère après l'envoi de la réponse
        | via defer() : aucun worker nécessaire, l'utilisateur n'attend pas Groq.
        */
        $autoReport = $needsRecompute && ! empty($project->ai_report);
        if ($autoReport) {
            $user = $request->user();
            $locale = app()->getLocale();
            \Illuminate\Support\defer(function () use ($project, $user, $locale) {
                app()->setLocale($locale);
                app(ProjectReportService::class)->generate($project->fresh(), $user, 'auto');
            });
        }

        return response()->json([...$project->fresh()->toArray(), 'ai_report_regenerating' => $autoReport]);
    }

    public function destroy(Request $request, Project $project)
    {
        abort_if($project->chef_de_projet_id !== $request->user()->id, 403);
        AuditLog::record($request->user(), 'project.deleted', ['project' => $project->name]);
        $project->delete();
        return response()->json(['message' => __('Projet supprimé.')]);
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

    public function generateReport(Request $request, Project $project, ProjectReportService $reports)
    {
        $this->authorizeReport($request, $project);

        $result = $reports->generate($project, $request->user(), 'manual');

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        AuditLog::record($request->user(), 'project.report_generated', ['project' => $project->name]);

        return response()->json([
            'project' => $result['project'],
            'report' => $result['report'],
        ]);
    }

    /** Historique des bilans IA d'un projet (pour comparer les versions). */
    public function reports(Request $request, Project $project)
    {
        $this->authorizeReport($request, $project);

        return response()->json(
            $project->reports()->with('author:id,first_name,last_name')->limit(20)->get()
        );
    }

    /** Le chef de projet propriétaire OU la direction de la même entreprise. */
    private function authorizeReport(Request $request, Project $project): void
    {
        $user = $request->user();
        $isOwner = $project->chef_de_projet_id === $user->id;
        $isDirector = $user->role === 'direction'
            && $user->company_id !== null
            && $project->company_id === $user->company_id;

        abort_unless($isOwner || $isDirector, 403);
    }
}
