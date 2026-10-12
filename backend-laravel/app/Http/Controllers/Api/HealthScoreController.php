<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancialHealthReport;
use App\Models\Project;
use App\Models\Ticket;
use App\Services\ProjectHealthService;
use Illuminate\Http\Request;

/*
| Enterprise Health Score : combine la santé des projets, du support client
| et des finances en un score global 0-100 pour la direction.
| Les composantes sans données sont ignorées (poids renormalisés).
*/
class HealthScoreController extends Controller
{
    private const WEIGHTS = ['projects' => 0.4, 'support' => 0.25, 'finance' => 0.35];

    public function index(Request $request, ProjectHealthService $health)
    {
        $companyId = $request->user()->company_id;

        $components = [
            'projects' => $this->projects($companyId, $health),
            'support' => $this->support($companyId),
            'finance' => $this->finance($companyId),
        ];

        $available = collect($components)->filter(fn ($c) => $c['score'] !== null);
        $weightSum = $available->keys()->sum(fn ($k) => self::WEIGHTS[$k]);

        $global = $weightSum > 0
            ? (int) round($available->map(fn ($c, $k) => $c['score'] * self::WEIGHTS[$k])->sum() / $weightSum)
            : null;

        return response()->json([
            'score' => $global,
            'label' => $global === null ? null : $this->label($global),
            'weights' => self::WEIGHTS,
            'components' => $components,
        ]);
    }

    private function projects(int $companyId, ProjectHealthService $health): array
    {
        $projects = Project::with('tasks')
            ->where('company_id', $companyId)
            ->where('status', '!=', 'termine')
            ->get();

        if ($projects->isEmpty()) {
            return ['score' => null, 'count' => 0, 'at_risk' => []];
        }

        $scored = $projects->map(fn (Project $p) => [
            'id' => $p->id,
            'name' => $p->name,
            'score' => $health->score($p, $p->tasks)['score'],
            'risk_level' => $p->risk_level,
        ]);

        return [
            'score' => (int) round($scored->avg('score')),
            'count' => $scored->count(),
            'at_risk' => $scored->sortBy('score')->take(3)->values(),
        ];
    }

    private function support(int $companyId): array
    {
        $tickets = Ticket::where('company_id', $companyId)->where('created_at', '>=', now()->subDays(30))->get();

        if ($tickets->isEmpty()) {
            return ['score' => null, 'open' => 0, 'resolved' => 0, 'critical_open' => 0];
        }

        $open = $tickets->whereIn('status', ['open', 'in_progress']);
        $resolved = $tickets->whereIn('status', ['resolved', 'closed'])->count();

        // Pénalité selon l'urgence des tickets encore ouverts + bonus de résolution
        $penalty = $open->sum(fn (Ticket $t) => match ($t->urgency) {
            'critical' => 15, 'high' => 8, 'medium' => 3, default => 1,
        }) + $open->where('sentiment', 'negative')->count() * 2;

        $resolutionRate = $resolved / $tickets->count();
        $score = (int) max(0, min(100, round(100 - $penalty + ($resolutionRate - 0.5) * 20)));

        return [
            'score' => $score,
            'open' => $open->count(),
            'resolved' => $resolved,
            'critical_open' => $open->where('urgency', 'critical')->count(),
        ];
    }

    private function finance(int $companyId): array
    {
        $report = FinancialHealthReport::where('company_id', $companyId)->latest()->first();

        return [
            'score' => $report ? (int) round((float) $report->health_score) : null,
            'financial_health' => $report?->financial_health,
            'report_date' => $report?->created_at?->toIso8601String(),
        ];
    }

    private function label(int $score): string
    {
        return $score >= 80 ? 'Bonne' : ($score >= 60 ? 'Moyenne' : ($score >= 40 ? 'Préoccupante' : 'Critique'));
    }
}
