<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProjectTrackingController extends Controller
{
    private function own(Request $request, Project $project): Project
    {
        abort_if($project->chef_de_projet_id !== $request->user()->id, 403);
        return $project;
    }

    private function log(Project $project, Request $request, string $type, string $message): void
    {
        ProjectActivity::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'type' => $type,
            'message' => $message,
        ]);
    }

    /** Vue d'ensemble de suivi : une ligne par projet du chef. */
    public function overview(Request $request)
    {
        $projects = Project::with(['team:id,first_name,last_name', 'tasks'])
            ->where('chef_de_projet_id', $request->user()->id)
            ->latest()->get();

        $rows = $projects->map(function (Project $p) {
            $tasks = $p->tasks;
            return [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'progress' => $p->progress,
                'deadline' => $p->deadline?->format('Y-m-d'),
                'risk_level' => $p->risk_level,
                'planned_effort' => $p->planned_effort,
                'predicted_effort' => $p->predicted_effort,
                'tasks_total' => $tasks->count(),
                'tasks_done' => $tasks->where('status', 'done')->count(),
                'tasks_late' => $tasks->filter(fn ($t) => $t->status !== 'done' && $t->due_date && $t->due_date->isPast())->count(),
                'team_size' => $p->team->count(),
            ];
        });

        $allTasks = $projects->flatMap->tasks;

        return response()->json([
            'projects' => $rows,
            'totals' => [
                'projects' => $projects->count(),
                'in_progress' => $projects->where('status', 'en_cours')->count(),
                'completed' => $projects->where('status', 'termine')->count(),
                'avg_progress' => (int) round($projects->avg('progress') ?? 0),
                'tasks_total' => $allTasks->count(),
                'tasks_done' => $allTasks->where('status', 'done')->count(),
                'tasks_late' => $allTasks->filter(fn ($t) => $t->status !== 'done' && $t->due_date && $t->due_date->isPast())->count(),
            ],
        ]);
    }

    /** Espace de suivi d'un projet : stats, courbes, charge par membre, prévision. */
    public function show(Request $request, Project $project)
    {
        $this->own($request, $project);
        $project->load(['team:id,first_name,last_name,job_title,email,weekly_capacity', 'tasks.assignee:id,first_name,last_name']);
        $tasks = $project->tasks;

        $byStatus = collect(Task::STATUSES)->mapWithKeys(fn ($s) => [$s => $tasks->where('status', $s)->count()]);
        $byPriority = collect(Task::PRIORITIES)->mapWithKeys(fn ($s) => [$s => $tasks->where('priority', $s)->count()]);

        $workload = $project->team->map(function (User $u) use ($tasks) {
            $mine = $tasks->where('assigned_to', $u->id);
            $open = $mine->where('status', '!=', 'done');
            return [
                'id' => $u->id,
                'name' => trim($u->first_name . ' ' . $u->last_name),
                'job_title' => $u->job_title,
                'tasks_total' => $mine->count(),
                'tasks_done' => $mine->where('status', 'done')->count(),
                'open_hours' => round($open->sum(fn ($t) => max($t->estimated_hours - $t->spent_hours, 0)), 1),
                'capacity' => $u->weekly_capacity,
            ];
        })->values();

        $totalHours = $tasks->sum('estimated_hours');
        $doneHours = $tasks->where('status', 'done')->sum('estimated_hours');
        $spentHours = $tasks->sum('spent_hours');

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'progress' => $project->progress,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'deadline' => $project->deadline?->format('Y-m-d'),
                'risk_level' => $project->risk_level,
                'planned_effort' => $project->planned_effort,
                'predicted_effort' => $project->predicted_effort,
            ],
            'team' => $project->team->map(fn ($u) => [
                'id' => $u->id,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'job_title' => $u->job_title,
                'email' => $u->email,
            ])->values(),
            'stats' => [
                'by_status' => $byStatus,
                'by_priority' => $byPriority,
                'total_hours' => round($totalHours, 1),
                'done_hours' => round($doneHours, 1),
                'spent_hours' => round($spentHours, 1),
                'tasks_late' => $tasks->filter(fn ($t) => $t->status !== 'done' && $t->due_date && $t->due_date->isPast())->count(),
            ],
            'workload' => $workload,
            'burndown' => $this->burndown($project, $tasks),
            'forecast' => $this->forecast($project, $tasks),
            'health' => $this->healthScore($project, $tasks),
            'activities' => $project->activities()->with('user:id,first_name,last_name')->limit(25)->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'type' => $a->type,
                    'message' => $a->message,
                    'user' => $a->user ? trim($a->user->first_name . ' ' . $a->user->last_name) : null,
                    'created_at' => $a->created_at->toIso8601String(),
                ]),
        ]);
    }

    /** Courbe de burndown : heures restantes idéales vs réelles (basées sur completed_at). */
    private function burndown(Project $project, $tasks): array
    {
        $total = (float) $tasks->sum('estimated_hours');
        $start = ($project->start_date ?? $project->created_at)->copy()->startOfDay();
        $end = ($project->deadline ?? $start->copy()->addDays(30))->copy()->startOfDay();
        if ($end->lte($start)) $end = $start->copy()->addDays(7);

        $days = max($start->diffInDays($end), 1);
        $step = max((int) ceil($days / 14), 1); // ~15 points max
        $today = Carbon::today();
        $points = [];

        for ($d = 0; $d <= $days + $step - 1; $d += $step) {
            $date = $start->copy()->addDays(min($d, $days));
            $ideal = round($total * max(1 - min($d, $days) / $days, 0), 1);
            $actual = null;
            if ($date->lte($today)) {
                $doneBy = $tasks->filter(fn ($t) => $t->status === 'done' && $t->completed_at
                    && $t->completed_at->startOfDay()->lte($date))->sum('estimated_hours');
                $actual = round($total - $doneBy, 1);
            }
            $points[] = ['date' => $date->format('Y-m-d'), 'ideal' => $ideal, 'actual' => $actual];
            if ($d >= $days) break;
        }
        return $points;
    }

    /** Prévision de fin basée sur la vélocité (heures terminées / jour écoulé). */
    private function forecast(Project $project, $tasks): array
    {
        $total = (float) $tasks->sum('estimated_hours');
        $done = (float) $tasks->where('status', 'done')->sum('estimated_hours');
        $remaining = max($total - $done, 0);
        $start = ($project->start_date ?? $project->created_at)->copy()->startOfDay();
        $elapsed = max($start->diffInDays(Carbon::today()), 1);
        $velocity = $done / $elapsed; // h / jour

        $eta = null;
        if ($remaining <= 0 && $total > 0) {
            $eta = Carbon::today();
        } elseif ($velocity > 0) {
            $eta = Carbon::today()->addDays((int) ceil($remaining / $velocity));
        }

        $deadline = $project->deadline;
        return [
            'velocity_per_day' => round($velocity, 2),
            'remaining_hours' => round($remaining, 1),
            'eta' => $eta?->format('Y-m-d'),
            'deadline' => $deadline?->format('Y-m-d'),
            'days_late' => ($eta && $deadline) ? (int) max($eta->diffInDays($deadline, false) * -1, 0) : null,
            'on_track' => ($eta && $deadline) ? $eta->lte($deadline) : null,
        ];
    }

    /** Score de santé 0-100 : avancement vs temps écoulé, retards, risque IA. */
    private function healthScore(Project $project, $tasks): array
    {
        $score = 100;
        $reasons = [];

        if ($project->deadline && $project->start_date) {
            $span = max($project->start_date->diffInDays($project->deadline), 1);
            $expected = min(100, (int) round($project->start_date->diffInDays(Carbon::today(), false) / $span * 100));
            $gap = $expected - $project->progress;
            if ($gap > 10) {
                $score -= min(30, $gap);
                $reasons[] = "Avancement en retard de {$gap} points sur le planning";
            }
        }

        $late = $tasks->filter(fn ($t) => $t->status !== 'done' && $t->due_date && $t->due_date->isPast())->count();
        if ($late > 0) {
            $score -= min(30, $late * 8);
            $reasons[] = "{$late} tâche(s) en retard";
        }

        $unassigned = $tasks->where('status', '!=', 'done')->whereNull('assigned_to')->count();
        if ($unassigned > 0) {
            $score -= min(15, $unassigned * 3);
            $reasons[] = "{$unassigned} tâche(s) non assignée(s)";
        }

        $riskPenalty = ['faible' => 0, 'moyen' => 8, 'modere' => 8, 'eleve' => 18, 'critique' => 25];
        $riskKey = $project->risk_level ? str_replace(['é', 'è'], 'e', mb_strtolower($project->risk_level)) : null;
        if ($riskKey && isset($riskPenalty[$riskKey])) {
            $score -= $riskPenalty[$riskKey];
            if ($riskPenalty[$riskKey] > 0) $reasons[] = "Risque IA : {$project->risk_level}";
        }

        $score = max(0, $score);
        return [
            'score' => $score,
            'label' => $score >= 80 ? 'Bonne' : ($score >= 60 ? 'Moyenne' : ($score >= 40 ? 'Préoccupante' : 'Critique')),
            'reasons' => $reasons,
        ];
    }

    /* ---------------- Gestion de l'équipe projet ---------------- */

    public function addMember(Request $request, Project $project)
    {
        $this->own($request, $project);
        $data = $request->validate(['user_id' => 'required|integer|exists:users,id']);

        $member = $request->user()->teamMembers()->findOrFail($data['user_id']);
        $project->team()->syncWithoutDetaching([$member->id]);
        $this->log($project, $request, 'member_added', "{$member->first_name} {$member->last_name} ajouté(e) au projet");

        return response()->json(['message' => 'Membre ajouté.']);
    }

    public function removeMember(Request $request, Project $project, User $user)
    {
        $this->own($request, $project);
        $project->team()->detach($user->id);
        Task::where('project_id', $project->id)->where('assigned_to', $user->id)->update(['assigned_to' => null]);
        $this->log($project, $request, 'member_removed', "{$user->first_name} {$user->last_name} retiré(e) du projet");

        return response()->json(['message' => 'Membre retiré.']);
    }

    /** Affecte toute une équipe nommée au projet. */
    public function assignTeam(Request $request, Project $project)
    {
        $this->own($request, $project);
        $data = $request->validate(['team_id' => 'nullable|integer|exists:teams,id']);

        if (!empty($data['team_id'])) {
            $team = \App\Models\Team::where('chef_id', $request->user()->id)->findOrFail($data['team_id']);
            $project->update(['team_id' => $team->id]);
            $project->team()->syncWithoutDetaching($team->members()->pluck('users.id')->all());
            $this->log($project, $request, 'team_assigned', "Équipe « {$team->name} » affectée au projet");
        } else {
            $project->update(['team_id' => null]);
        }

        return response()->json(['message' => 'Équipe mise à jour.']);
    }

    /* ---------------- Fonctionnalités avancées ---------------- */

    /**
     * Auto-répartition équilibrée : chaque tâche non assignée va au membre du projet
     * ayant le moins d'heures ouvertes (rapportées à sa capacité hebdomadaire).
     */
    public function autoAssign(Request $request, Project $project)
    {
        $this->own($request, $project);
        $members = $project->team()->get();
        abort_if($members->isEmpty(), 422, "Ajoutez d'abord des membres au projet.");

        $load = $members->mapWithKeys(fn ($u) => [$u->id => (float) Task::where('project_id', $project->id)
            ->where('assigned_to', $u->id)->where('status', '!=', 'done')->sum('estimated_hours')]);
        $cap = $members->mapWithKeys(fn ($u) => [$u->id => max($u->weekly_capacity, 1)]);

        $pending = Task::where('project_id', $project->id)->whereNull('assigned_to')
            ->where('status', '!=', 'done')
            ->orderByRaw("CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END")
            ->orderByDesc('estimated_hours')->get();

        $assigned = [];
        foreach ($pending as $task) {
            $uid = $load->keys()->sortBy(fn ($id) => $load[$id] / $cap[$id])->first();
            $task->update(['assigned_to' => $uid]);
            $load[$uid] += max($task->estimated_hours, 1);
            $assigned[] = ['task_id' => $task->id, 'title' => $task->title, 'user_id' => $uid];
        }

        if ($assigned) {
            $this->log($project, $request, 'auto_assign', count($assigned) . ' tâche(s) réparties automatiquement');
        }

        return response()->json(['assigned' => $assigned, 'message' => count($assigned) . ' tâche(s) assignée(s).']);
    }

    /** Génération de tâches par IA (Groq) avec repli déterministe si l'API est indisponible. */
    public function generateTasks(Request $request, Project $project)
    {
        $this->own($request, $project);
        $count = (int) min(max((int) $request->input('count', 6), 3), 12);

        $generated = $this->askGroqForTasks($project, $count) ?? $this->fallbackTasks($project);

        $created = [];
        foreach (array_slice($generated, 0, $count) as $t) {
            $created[] = Task::create([
                'project_id' => $project->id,
                'created_by' => $request->user()->id,
                'title' => mb_substr($t['title'], 0, 200),
                'description' => $t['description'] ?? null,
                'priority' => in_array($t['priority'] ?? '', Task::PRIORITIES) ? $t['priority'] : 'medium',
                'estimated_hours' => (float) ($t['estimated_hours'] ?? 8),
                'due_date' => $project->deadline,
            ]);
        }

        $project->recalculateProgress();
        $this->log($project, $request, 'ai_tasks', count($created) . ' tâche(s) générée(s) par l\'IA');

        return response()->json(['tasks' => $created, 'source' => $this->lastSource ?? 'fallback'], 201);
    }

    private ?string $lastSource = null;

    private function askGroqForTasks(Project $project, int $count): ?array
    {
        $key = config('services.groq.key');
        if (!$key) return null;

        try {
            $response = Http::withToken($key)->timeout(15)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un chef de projet logiciel. Réponds UNIQUEMENT par un tableau JSON valide, sans texte autour.'],
                    ['role' => 'user', 'content' => "Découpe ce projet en {$count} tâches concrètes. Format: [{\"title\":\"...\",\"description\":\"...\",\"priority\":\"low|medium|high|critical\",\"estimated_hours\":number}]. "
                        . "Projet: {$project->name}. Description: " . ($project->description ?? 'non précisée')
                        . ". Effort prévu total: {$project->planned_effort} h."],
                ],
                'temperature' => 0.4,
                'max_tokens' => 1200,
            ]);
            if ($response->failed()) return null;

            $text = $response->json('choices.0.message.content') ?? '';
            if (preg_match('/\[.*\]/s', $text, $m)) {
                $arr = json_decode($m[0], true);
                if (is_array($arr) && !empty($arr) && isset($arr[0]['title'])) {
                    $this->lastSource = 'groq';
                    return $arr;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Groq task generation failed', ['message' => $e->getMessage()]);
        }
        return null;
    }

    private function fallbackTasks(Project $project): array
    {
        $this->lastSource = 'fallback';
        $effort = max((float) $project->planned_effort, 60);
        $split = [
            ['Cadrage et analyse des besoins', 'Recueillir et valider les exigences.', 'high', 0.12],
            ['Conception technique et architecture', 'Modélisation, choix techniques.', 'high', 0.15],
            ['Développement du backend', 'API, base de données, logique métier.', 'high', 0.25],
            ['Développement du frontend', 'Interfaces et intégration API.', 'medium', 0.22],
            ['Tests et recette', 'Tests unitaires, intégration, correction.', 'medium', 0.14],
            ['Déploiement et documentation', 'Mise en production, livrables.', 'low', 0.12],
        ];
        return array_map(fn ($s) => [
            'title' => $s[0], 'description' => $s[1], 'priority' => $s[2],
            'estimated_hours' => round($effort * $s[3]),
        ], $split);
    }
}
