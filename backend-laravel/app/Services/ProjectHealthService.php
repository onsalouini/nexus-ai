<?php

namespace App\Services;

use App\Models\Project;
use Carbon\Carbon;

class ProjectHealthService
{
    /** Score de santé 0-100 : avancement vs temps écoulé, retards, risque IA. */
    public function score(Project $project, $tasks): array
    {
        $score = 100;
        $reasons = [];
        // Codes structurés (traduits côté frontend) en parallèle des phrases FR historiques
        $signals = [];

        if ($project->deadline && $project->start_date) {
            $span = max($project->start_date->diffInDays($project->deadline), 1);
            $expected = min(100, (int) round($project->start_date->diffInDays(Carbon::today(), false) / $span * 100));
            $gap = $expected - $project->progress;
            if ($gap > 10) {
                $score -= min(30, $gap);
                $reasons[] = "Avancement en retard de {$gap} points sur le planning";
                $signals[] = ['code' => 'progress_behind', 'value' => $gap];
            }
        }

        $late = $tasks->filter(fn ($t) => $t->status !== 'done' && $t->due_date && $t->due_date->isPast())->count();
        if ($late > 0) {
            $score -= min(30, $late * 8);
            $reasons[] = "{$late} tâche(s) en retard";
            $signals[] = ['code' => 'late_tasks', 'value' => $late];
        }

        $unassigned = $tasks->where('status', '!=', 'done')->whereNull('assigned_to')->count();
        if ($unassigned > 0) {
            $score -= min(15, $unassigned * 3);
            $reasons[] = "{$unassigned} tâche(s) non assignée(s)";
            $signals[] = ['code' => 'unassigned_tasks', 'value' => $unassigned];
        }

        $riskPenalty = ['faible' => 0, 'moyen' => 8, 'modere' => 8, 'eleve' => 18, 'critique' => 25];
        $riskKey = $project->risk_level ? str_replace(['é', 'è'], 'e', mb_strtolower($project->risk_level)) : null;
        if ($riskKey && isset($riskPenalty[$riskKey])) {
            $score -= $riskPenalty[$riskKey];
            if ($riskPenalty[$riskKey] > 0) {
                $reasons[] = "Risque IA : {$project->risk_level}";
                $signals[] = ['code' => 'ai_risk', 'value' => $project->risk_level];
            }
        }

        $score = max(0, $score);
        return [
            'score' => $score,
            'label' => $score >= 80 ? 'Bonne' : ($score >= 60 ? 'Moyenne' : ($score >= 40 ? 'Préoccupante' : 'Critique')),
            'reasons' => $reasons,
            'signals' => $signals,
        ];
    }

    /** Projet dont le risque IA est élevé ou critique. */
    public static function isHighRisk(?string $riskLevel): bool
    {
        if (! $riskLevel) {
            return false;
        }
        $key = str_replace(['é', 'è'], 'e', mb_strtolower($riskLevel));

        return in_array($key, ['eleve', 'elevee', 'critique'], true);
    }
}
