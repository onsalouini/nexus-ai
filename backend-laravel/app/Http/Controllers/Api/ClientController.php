<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChangeRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\NotificationService;
use App\Services\TicketTriageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/*
| Espace client externe : suivi de l'avancement de ses projets et tickets de support
| (tri automatique par le modèle ML, fil de discussion avec l'équipe support).
| Le client ne voit jamais les données internes (risque IA, charge, budget).
*/
class ClientController extends Controller
{
    public function projects(Request $request)
    {
        $projects = Project::with('chefDeProjet:id,first_name,last_name,email,avatar_path,avatar_color')
            ->where('client_id', $request->user()->id)
            ->latest()
            ->get(['id', 'name', 'description', 'status', 'progress', 'start_date', 'deadline', 'chef_de_projet_id']);

        $ids = $projects->pluck('id');
        $tasks = Task::whereIn('project_id', $ids)->get(['id', 'project_id', 'title', 'status', 'due_date', 'completed_at']);
        $openTickets = Ticket::whereIn('project_id', $ids)->whereIn('status', ['open', 'in_progress'])
            ->selectRaw('project_id, count(*) as total')->groupBy('project_id')->pluck('total', 'project_id');

        return response()->json(['projects' => $projects->map(function (Project $p) use ($tasks, $openTickets) {
            $mine = $tasks->where('project_id', $p->id);

            return [
                ...$p->only(['id', 'name', 'description', 'status', 'progress', 'start_date', 'deadline']),
                'chef' => $p->chefDeProjet,
                'schedule' => $this->schedule($p),
                'tasks' => [
                    'total' => $mine->count(),
                    'done' => $mine->where('status', 'done')->count(),
                    'in_progress' => $mine->whereIn('status', ['in_progress', 'review'])->count(),
                ],
                'recent_done' => $mine->where('status', 'done')->whereNotNull('completed_at')
                    ->sortByDesc('completed_at')->take(4)->values()
                    ->map(fn (Task $t) => ['title' => $t->title, 'date' => $t->completed_at->toIso8601String()]),
                'upcoming' => $mine->where('status', '!=', 'done')->whereNotNull('due_date')
                    ->sortBy('due_date')->take(3)->values()
                    ->map(fn (Task $t) => ['title' => $t->title, 'date' => $t->due_date->toDateString()]),
                'open_tickets' => (int) ($openTickets[$p->id] ?? 0),
            ];
        })]);
    }

    /** Suivi détaillé d'un projet : courbe d'évolution, tâches, historique, demandes de changement. */
    public function project(Request $request, Project $project)
    {
        abort_unless($project->client_id === $request->user()->id, 403);
        $project->load('chefDeProjet:id,first_name,last_name,email,avatar_path,avatar_color');
        $tasks = $project->tasks()->orderByRaw('due_date IS NULL, due_date')->get(['id', 'title', 'status', 'priority', 'due_date', 'completed_at', 'estimated_hours']);

        // Jalons visibles par le client : tâches terminées et demandes traitées
        $timeline = $tasks->where('status', 'done')->whereNotNull('completed_at')
            ->map(fn (Task $t) => ['type' => 'task_done', 'title' => $t->title, 'date' => $t->completed_at->toIso8601String()])
            ->concat($project->changeRequests()->whereNotNull('responded_at')->get()
                ->map(fn (ChangeRequest $c) => ['type' => "change_{$c->status}", 'title' => $c->title, 'date' => $c->responded_at->toIso8601String()]))
            ->sortByDesc('date')->take(15)->values();

        return response()->json([
            'project' => [
                ...$project->only(['id', 'name', 'description', 'status', 'progress', 'start_date', 'deadline']),
                'chef' => $project->chefDeProjet,
                'schedule' => $this->schedule($project),
            ],
            'evolution' => $this->evolution($project, $tasks),
            'tasks' => $tasks->map(fn (Task $t) => $t->only(['id', 'title', 'status', 'priority', 'due_date'])),
            'timeline' => $timeline,
            'change_requests' => $project->changeRequests()->with('responder:id,first_name,last_name')->get(),
        ]);
    }

    /** Courbe d'avancement : réel (heures terminées) vs prévu (linéaire entre début et échéance), en %. */
    private function evolution(Project $project, $tasks): array
    {
        $total = max((float) $tasks->sum(fn ($t) => max($t->estimated_hours, 1)), 1);
        $start = ($project->start_date ?? $project->created_at)->copy()->startOfDay();
        $end = ($project->deadline ?? $start->copy()->addDays(30))->copy()->startOfDay();
        if ($end->lte($start)) {
            $end = $start->copy()->addDays(7);
        }
        $days = max($start->diffInDays($end), 1);
        $step = max((int) ceil($days / 12), 1);
        $today = Carbon::today();
        $points = [];

        for ($d = 0; ; $d += $step) {
            $date = $start->copy()->addDays(min($d, $days));
            $done = $tasks->filter(fn ($t) => $t->status === 'done' && $t->completed_at && $t->completed_at->copy()->startOfDay()->lte($date))
                ->sum(fn ($t) => max($t->estimated_hours, 1));
            $points[] = [
                'date' => $date->toDateString(),
                'planned' => (int) round(min($d, $days) / $days * 100),
                'actual' => $date->lte($today) ? (int) round($done / $total * 100) : null,
            ];
            if ($d >= $days) {
                break;
            }
        }

        return $points;
    }

    /** Le client demande une modification : le chef de projet est notifié. */
    public function storeChangeRequest(Request $request, Project $project)
    {
        $user = $request->user();
        abort_unless($project->client_id === $user->id, 403);
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:5000',
            'priority' => ['nullable', Rule::in(ChangeRequest::PRIORITIES)],
        ]);

        $change = ChangeRequest::create([...$data, 'priority' => $data['priority'] ?? 'normal', 'project_id' => $project->id, 'client_id' => $user->id]);

        if ($chef = $project->chefDeProjet) {
            app(NotificationService::class)->notify($chef, 'change_request_new',
                ['title' => $change->title, 'project' => $project->name, 'name' => trim("{$user->first_name} {$user->last_name}")],
                '/dashboard/chef/change-requests', $change->priority === 'high' ? 'warning' : 'info');
        }

        return response()->json($change, 201);
    }

    /** Avancement réel comparé au temps écoulé : on_track | watch | late | done. */
    private function schedule(Project $p): string
    {
        if ($p->status === 'termine' || $p->progress >= 100) {
            return 'done';
        }
        if (! $p->start_date || ! $p->deadline) {
            return 'on_track';
        }
        if ($p->deadline->isPast()) {
            return 'late';
        }
        $span = max($p->start_date->diffInDays($p->deadline), 1);
        $expected = min(100, max(0, $p->start_date->diffInDays(Carbon::today(), false) / $span * 100));
        $gap = $expected - $p->progress;

        return $gap > 25 ? 'late' : ($gap > 10 ? 'watch' : 'on_track');
    }

    public function tickets(Request $request)
    {
        $tickets = Ticket::with(['project:id,name'])->withCount('messages')
            ->where('created_by', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['tickets' => $tickets]);
    }

    private function mine(Request $request, Ticket $ticket): Ticket
    {
        abort_unless($ticket->created_by === $request->user()->id, 403);

        return $ticket;
    }

    public function showTicket(Request $request, Ticket $ticket)
    {
        return response()->json(TicketController::detail($this->mine($request, $ticket)));
    }

    public function storeTicket(Request $request, TicketTriageService $triage, NotificationService $notifications)
    {
        $user = $request->user();
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:5000',
            'project_id' => ['nullable', Rule::exists('projects', 'id')->where('client_id', $user->id)],
        ]);

        $ticket = Ticket::create([
            ...$data,
            ...$triage->classify($data['title'], $data['description']),
            'company_id' => $user->company_id,
            'created_by' => $user->id,
            'customer_name' => trim("{$user->first_name} {$user->last_name}"),
            'customer_email' => $user->email,
        ]);
        $notifications->ticketCreated($ticket);

        return response()->json(TicketController::detail($ticket), 201);
    }

    public function replyTicket(Request $request, Ticket $ticket, NotificationService $notifications)
    {
        $this->mine($request, $ticket);
        $data = $request->validate(['body' => 'required|string|max:5000']);

        TicketMessage::create(['ticket_id' => $ticket->id, 'user_id' => $request->user()->id, 'body' => $data['body']]);

        // Un message du client rouvre un ticket résolu
        if (in_array($ticket->status, ['resolved', 'closed'], true)) {
            $ticket->update(['status' => 'open', 'resolved_at' => null]);
        }
        $notifications->ticketReplied($ticket->load(TicketController::WITH), $request->user());

        return response()->json(TicketController::detail($ticket), 201);
    }

    /** Le client confirme que son problème est réglé. */
    public function closeTicket(Request $request, Ticket $ticket)
    {
        $this->mine($request, $ticket)->update(['status' => 'closed', 'resolved_at' => $ticket->resolved_at ?? now()]);

        return response()->json(TicketController::detail($ticket));
    }
}
