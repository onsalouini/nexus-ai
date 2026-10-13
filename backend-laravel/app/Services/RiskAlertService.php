<?php

namespace App\Services;

use App\Models\Company;
use App\Models\FinancialHealthReport;
use App\Models\Project;
use App\Models\User;

/*
| Alertes de risque :
|  - projet : dépassement d'effort prédit par le modèle ≥ seuil de l'entreprise, ou niveau « Élevé » ;
|  - faillite : probabilité du modèle financier ≥ seuil de l'entreprise.
| Déclenchées après chaque prédiction, envoyées au chef concerné et à la direction
| (notification critique + email Brevo).
*/
class RiskAlertService
{
    public const DEFAULT_RISK_THRESHOLD = 35;
    public const DEFAULT_BANKRUPTCY_THRESHOLD = 50;

    public function __construct(private NotificationService $notifications) {}

    public static function thresholds(?Company $company): array
    {
        return [
            'risk' => (int) ($company?->risk_alert_threshold ?? self::DEFAULT_RISK_THRESHOLD),
            'bankruptcy' => (int) ($company?->bankruptcy_alert_threshold ?? self::DEFAULT_BANKRUPTCY_THRESHOLD),
        ];
    }

    public static function projectIsAlert(Project $project, int $threshold): bool
    {
        return ($project->risk_score !== null && $project->risk_score >= $threshold)
            || ProjectHealthService::isHighRisk($project->risk_level);
    }

    /** @param bool $email false lors des contrôles périodiques : seule une nouvelle prédiction envoie un email */
    public function checkProject(Project $project, bool $email = true): void
    {
        $project->loadMissing('company');
        $threshold = self::thresholds($project->company)['risk'];

        if ($project->status === 'termine' || ! self::projectIsAlert($project, $threshold)) {
            return;
        }

        $data = [
            'project' => $project->name,
            'risk_level' => $project->risk_level,
            'risk_score' => $project->risk_score !== null ? (int) round($project->risk_score) : null,
            'threshold' => $threshold,
        ];
        // Une alerte par valeur de risque : une nouvelle prédiction différente re-déclenche l'alerte
        $dedupe = "risk:{$project->id}:" . (int) round($project->risk_score ?? 0) . ':' . $project->risk_level;

        $recipients = User::where('company_id', $project->company_id)
            ->where(fn ($q) => $q->where('role', 'direction')->orWhere('id', $project->chef_de_projet_id))
            ->get();

        $this->notifications->notifyMany($recipients, 'project_risk_alert', $data,
            fn (User $u) => $u->role === 'direction' ? "/dashboard/direction/projects/{$project->id}" : '/dashboard/chef/risk-predictions',
            'critical', $dedupe, $email);
    }

    public function checkFinancialReport(FinancialHealthReport $report): void
    {
        $threshold = self::thresholds(Company::find($report->company_id))['bankruptcy'];
        $probability = round((float) $report->bankruptcy_probability * 100, 1);

        if ($probability < $threshold) {
            return;
        }

        $this->notifications->notifyMany(
            User::where('company_id', $report->company_id)->where('role', 'direction')->get(),
            'bankruptcy_alert',
            ['probability' => $probability, 'threshold' => $threshold, 'health_score' => (float) $report->health_score],
            fn () => '/dashboard/direction/analytics',
            'critical',
            "bankruptcy:{$report->id}"
        );
    }

    /** Alertes actives (bandeau des tableaux de bord). */
    public function active(User $user): array
    {
        $company = $user->company;
        $thresholds = self::thresholds($company);

        $projects = Project::where('company_id', $user->company_id)
            ->where('status', '!=', 'termine')
            ->when($user->role === 'chef_de_projet', fn ($q) => $q->where('chef_de_projet_id', $user->id))
            ->get(['id', 'name', 'risk_level', 'risk_score', 'status', 'updated_at'])
            ->filter(fn (Project $p) => self::projectIsAlert($p, $thresholds['risk']))
            ->sortByDesc('risk_score')
            ->values()
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'risk_level' => $p->risk_level,
                'risk_score' => $p->risk_score !== null ? (int) round($p->risk_score) : null,
            ]);

        $bankruptcy = null;
        if ($user->role === 'direction') {
            $report = FinancialHealthReport::where('company_id', $user->company_id)->latest()->first();
            if ($report) {
                $probability = round((float) $report->bankruptcy_probability * 100, 1);
                $bankruptcy = [
                    'probability' => $probability,
                    'health_score' => (float) $report->health_score,
                    'alert' => $probability >= $thresholds['bankruptcy'],
                    'date' => $report->created_at->toIso8601String(),
                ];
            }
        }

        return ['thresholds' => $thresholds, 'projects' => $projects, 'bankruptcy' => $bankruptcy];
    }
}
