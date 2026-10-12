<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/*
| Notifications calculées à partir des données (pas de table dédiée) :
| tâches en retard / à échéance proche, projets à risque élevé, invitations acceptées,
| tickets critiques, bilans IA régénérés automatiquement.
| Le texte est construit côté frontend à partir de "type" + "data" (traduisible).
*/
class NotificationService
{
    private const MAX = 30;

    public function for(User $user): Collection
    {
        $items = collect();

        match ($user->role) {
            'direction' => $this->forDirection($user, $items),
            'chef_de_projet' => $this->forChef($user, $items),
            default => $this->forEmployee($user, $items),
        };

        $readAt = $user->notifications_read_at;

        return $items
            ->sortByDesc('created_at')
            ->take(self::MAX)
            ->values()
            ->map(fn (array $n) => [
                ...$n,
                'read' => $readAt !== null && Carbon::parse($n['created_at'])->lte($readAt),
            ]);
    }

    private function forDirection(User $user, Collection $items): void
    {
        $projects = Project::where('company_id', $user->company_id)
            ->whereNotIn('status', ['termine'])
            ->get(['id', 'name', 'risk_level', 'updated_at']);

        $this->highRisk($projects, $items, fn (Project $p) => "/dashboard/direction/projects/{$p->id}");
        $this->acceptedInvitations(Invitation::where('company_id', $user->company_id), $items);
        $this->criticalTickets($user, $items, '/dashboard/direction');

        // Retards agrégés par projet pour ne pas noyer la direction
        Task::whereIn('project_id', $projects->pluck('id'))
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<', today())
            ->get(['project_id', 'due_date'])
            ->groupBy('project_id')
            ->each(function ($tasks, $projectId) use ($projects, $items) {
                $project = $projects->firstWhere('id', $projectId);
                $items->push([
                    'id' => "late-project-{$projectId}",
                    'type' => 'project_late_tasks',
                    'data' => ['project' => $project?->name, 'count' => $tasks->count()],
                    'created_at' => $tasks->max('due_date')->copy()->endOfDay()->toIso8601String(),
                    'link' => "/dashboard/direction/projects/{$projectId}",
                ]);
            });
    }

    private function forChef(User $user, Collection $items): void
    {
        $projects = Project::where('chef_de_projet_id', $user->id)->get(['id', 'name', 'risk_level', 'updated_at']);

        $this->highRisk($projects, $items, fn () => '/dashboard/chef/risk-predictions');
        $this->lateTasks(Task::whereIn('project_id', $projects->pluck('id')), $items, '/dashboard/chef/tasks');
        $this->acceptedInvitations(Invitation::where('invited_by', $user->id), $items);

        ProjectActivity::whereIn('project_id', $projects->pluck('id'))
            ->where('type', 'ai_report_auto')
            ->where('created_at', '>=', now()->subDays(7))
            ->get()
            ->each(fn (ProjectActivity $a) => $items->push([
                'id' => "report-{$a->id}",
                'type' => 'ai_report_auto',
                'data' => ['project' => $projects->firstWhere('id', $a->project_id)?->name],
                'created_at' => $a->created_at->toIso8601String(),
                'link' => '/dashboard/chef',
            ]));
    }

    private function forEmployee(User $user, Collection $items): void
    {
        $base = $user->role === 'agent_support' ? '/dashboard/support' : '/dashboard/membre';
        $mine = Task::where('assigned_to', $user->id);

        $this->lateTasks(clone $mine, $items, $base);

        (clone $mine)->with('project:id,name')
            ->where('status', '!=', 'done')
            ->whereBetween('due_date', [today(), today()->addDays(2)])
            ->get()
            ->each(fn (Task $t) => $items->push([
                'id' => "soon-{$t->id}",
                'type' => 'task_due_soon',
                'data' => ['task' => $t->title, 'project' => $t->project?->name, 'due_date' => $t->due_date?->toDateString()],
                'created_at' => $t->updated_at->toIso8601String(),
                'link' => $base,
            ]));

        if ($user->role === 'agent_support') {
            $this->criticalTickets($user, $items, $base);
        }
    }

    private function highRisk(Collection $projects, Collection $items, callable $link): void
    {
        $projects->filter(fn (Project $p) => ProjectHealthService::isHighRisk($p->risk_level))
            ->each(fn (Project $p) => $items->push([
                'id' => "risk-{$p->id}",
                'type' => 'project_high_risk',
                'data' => ['project' => $p->name, 'risk_level' => $p->risk_level],
                'created_at' => $p->updated_at->toIso8601String(),
                'link' => $link($p),
            ]));
    }

    private function lateTasks($query, Collection $items, string $link): void
    {
        $query->with('project:id,name')
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<', today())
            ->get()
            ->each(fn (Task $t) => $items->push([
                'id' => "late-{$t->id}",
                'type' => 'task_late',
                'data' => ['task' => $t->title, 'project' => $t->project?->name, 'due_date' => $t->due_date?->toDateString()],
                'created_at' => $t->due_date->copy()->endOfDay()->toIso8601String(),
                'link' => $link,
            ]));
    }

    private function acceptedInvitations($query, Collection $items): void
    {
        $query->whereNotNull('accepted_at')
            ->where('accepted_at', '>=', now()->subDays(30))
            ->get()
            ->each(fn (Invitation $i) => $items->push([
                'id' => "invitation-{$i->id}",
                'type' => 'invitation_accepted',
                'data' => ['name' => $i->first_name ?: $i->email, 'role' => $i->role],
                'created_at' => $i->accepted_at->toIso8601String(),
                'link' => null,
            ]));
    }

    private function criticalTickets(User $user, Collection $items, string $link): void
    {
        Ticket::where('company_id', $user->company_id)
            ->whereIn('status', ['open', 'in_progress'])
            ->where('urgency', 'critical')
            ->get()
            ->each(fn (Ticket $t) => $items->push([
                'id' => "ticket-{$t->id}",
                'type' => 'ticket_critical',
                'data' => ['title' => $t->title],
                'created_at' => $t->created_at->toIso8601String(),
                'link' => $link,
            ]));
    }
}
