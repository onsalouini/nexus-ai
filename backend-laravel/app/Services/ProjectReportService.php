<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\ProjectReport;
use App\Models\User;

/*
| Génère le bilan IA d'un projet, le sauvegarde sur le projet
| et l'ajoute à l'historique (project_reports) pour pouvoir comparer les versions.
*/
class ProjectReportService
{
    public function __construct(
        private AIReportService $aiReportService,
        private RiskPredictionService $riskPredictionService,
    ) {}

    /**
     * @return array{ok: bool, status: int, message?: string, report?: array, project?: Project}
     */
    public function generate(Project $project, ?User $by = null, string $trigger = 'manual'): array
    {
        // Prédiction absente ou explication jamais calculée : on réinterroge le modèle
        if (is_null($project->predicted_effort) || empty($project->risk_explanation)) {
            $this->refreshPrediction($project);
        }

        if (is_null($project->predicted_effort)) {
            return ['ok' => false, 'status' => 422, 'message' => __('La prédiction ML n\'est pas encore disponible pour ce projet.')];
        }

        if (is_null($project->risk_score)) {
            return ['ok' => false, 'status' => 422, 'message' => __('L\'écart de risque n\'est pas disponible pour ce projet.')];
        }

        $report = $this->aiReportService->generate([
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

        if (! $report) {
            return ['ok' => false, 'status' => 502, 'message' => __('Impossible de générer le bilan AI.')];
        }

        $this->store($project, $report, $by, $trigger);

        return ['ok' => true, 'status' => 200, 'report' => $report, 'project' => $project->fresh()];
    }

    /** Enregistre le bilan courant + une entrée d'historique. */
    public function store(Project $project, array $report, ?User $by, string $trigger): ProjectReport
    {
        $project->update([
            'ai_report' => $report,
            'ai_report_generated_at' => now(),
        ]);

        if ($trigger === 'auto') {
            ProjectActivity::create([
                'project_id' => $project->id,
                'user_id' => $by?->id,
                'type' => 'ai_report_auto',
                'message' => 'Bilan IA régénéré automatiquement après modification du projet',
            ]);
        }

        return ProjectReport::create([
            'project_id' => $project->id,
            'generated_by' => $by?->id,
            'trigger' => $trigger,
            'report' => $report,
            'planned_effort' => $project->planned_effort,
            'predicted_effort' => $project->predicted_effort,
            'risk_level' => $project->risk_level,
            'risk_score' => $project->risk_score,
        ]);
    }

    private function refreshPrediction(Project $project): void
    {
        $prediction = $this->riskPredictionService->predict([
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
                'risk_score' => isset($prediction['gap_percent']) ? (int) round($prediction['gap_percent']) : null,
                'risk_explanation' => $prediction['explanation'] ?? null,
            ]);
        }
    }
}
