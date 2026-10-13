<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/*
| Notifications persistantes (table app_notifications).
|  - notify() : créée à chaque événement (tâche assignée, réponse à un ticket, alerte de risque…)
|  - scan()   : contrôles périodiques (retards, échéances, tickets critiques), exécutés
|               à la consultation (au plus toutes les 5 min par utilisateur) et par la commande
|               planifiée nexus:scan-alerts.
| Le texte est construit côté frontend à partir de "type" + "data" (traduisible).
| Les notifications critiques partent aussi par email (Brevo) si l'utilisateur l'accepte.
*/
class NotificationService
{
    private const MAX = 50;
    private const SCAN_EVERY_MINUTES = 5;

    /** Types envoyés aussi par email lorsqu'ils sont critiques. */
    private const EMAIL_TYPES = ['project_risk_alert', 'bankruptcy_alert', 'ticket_new'];

    public static function basePath(?string $role): string
    {
        return match ($role) {
            'direction' => '/dashboard/direction',
            'chef_de_projet' => '/dashboard/chef',
            'agent_support' => '/dashboard/support',
            'client' => '/dashboard/client',
            default => '/dashboard/membre',
        };
    }

    public function notify(User $user, string $type, array $data = [], ?string $link = null, string $severity = 'info', ?string $dedupe = null, bool $email = true): ?AppNotification
    {
        if ($dedupe && AppNotification::where('user_id', $user->id)->where('dedupe_key', $dedupe)->exists()) {
            return null;
        }

        try {
            $notification = AppNotification::create([
                'user_id' => $user->id,
                'type' => $type,
                'severity' => $severity,
                'data' => $data,
                'link' => $link,
                'dedupe_key' => $dedupe,
            ]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException) {
            return null; // créée entre-temps par une requête concurrente
        }

        if ($email && $severity === 'critical' && in_array($type, self::EMAIL_TYPES, true) && $user->email_alerts !== false) {
            defer(fn () => $this->email($user, $notification));
        }

        return $notification;
    }

    /** @param iterable<User> $users */
    public function notifyMany(iterable $users, string $type, array $data = [], ?callable $link = null, string $severity = 'info', ?string $dedupe = null, bool $email = true): void
    {
        foreach ($users as $user) {
            $this->notify($user, $type, $data, $link ? $link($user) : null, $severity, $dedupe, $email);
        }
    }

    /** Dernières notifications de l'utilisateur, après un contrôle des alertes périodiques. */
    public function for(User $user)
    {
        $this->scan($user);

        return AppNotification::where('user_id', $user->id)
            ->latest()
            ->limit(self::MAX)
            ->get()
            ->map(fn (AppNotification $n) => [
                'id' => $n->id,
                'type' => $n->type,
                'severity' => $n->severity,
                'data' => $n->data ?? [],
                'link' => $n->link,
                'read' => $n->read_at !== null,
                'created_at' => $n->created_at->toIso8601String(),
            ]);
    }

    public function scan(User $user, bool $force = false): void
    {
        if (! $force && ! Cache::add("notif-scan:{$user->id}", true, now()->addMinutes(self::SCAN_EVERY_MINUTES))) {
            return;
        }

        $base = self::basePath($user->role);

        match ($user->role) {
            'direction' => $this->scanDirection($user, $base),
            'chef_de_projet' => $this->scanChef($user, $base),
            'client' => null, // le client est notifié à chaque réponse sur ses tickets
            default => $this->scanEmployee($user, $base),
        };
    }

    private function scanDirection(User $user, string $base): void
    {
        $active = Project::where('company_id', $user->company_id)->whereNotIn('status', ['termine'])->get();
        $active->each(fn (Project $p) => app(RiskAlertService::class)->checkProject($p, email: false));
        $projects = $active->pluck('name', 'id');

        // Retards agrégés par projet pour ne pas noyer la direction
        Task::whereIn('project_id', $projects->keys())
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<', today())
            ->get(['project_id'])
            ->countBy('project_id')
            ->each(fn ($count, $projectId) => $this->notify($user, 'project_late_tasks',
                ['project' => $projects[$projectId] ?? null, 'count' => $count],
                "{$base}/projects/{$projectId}", 'warning', "late-project:{$projectId}:" . today()->toDateString()));

        $this->criticalTickets($user, "{$base}/support");
        $this->acceptedInvitations(Invitation::where('company_id', $user->company_id), $user);
    }

    private function scanChef(User $user, string $base): void
    {
        $projects = Project::where('chef_de_projet_id', $user->id)->get();
        $projects->each(fn (Project $p) => app(RiskAlertService::class)->checkProject($p, email: false));
        $projectIds = $projects->pluck('id');

        $this->lateTasks(Task::whereIn('project_id', $projectIds), $user, "{$base}/tasks");
        $this->acceptedInvitations(Invitation::where('invited_by', $user->id), $user);
    }

    private function scanEmployee(User $user, string $base): void
    {
        $tasksLink = $user->role === 'agent_support' ? "{$base}/tasks" : $base;
        $mine = Task::where('assigned_to', $user->id);

        $this->lateTasks(clone $mine, $user, $tasksLink);

        (clone $mine)->with('project:id,name')
            ->where('status', '!=', 'done')
            ->whereBetween('due_date', [today(), today()->addDays(2)])
            ->get()
            ->each(fn (Task $t) => $this->notify($user, 'task_due_soon',
                ['task' => $t->title, 'project' => $t->project?->name, 'due_date' => $t->due_date?->toDateString()],
                $tasksLink, 'warning', "soon:{$t->id}:{$t->due_date?->toDateString()}"));

        if ($user->role === 'agent_support') {
            $this->criticalTickets($user, $base);
        }
    }

    private function lateTasks($query, User $user, string $link): void
    {
        $query->with('project:id,name')
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<', today())
            ->get()
            ->each(fn (Task $t) => $this->notify($user, 'task_late',
                ['task' => $t->title, 'project' => $t->project?->name, 'due_date' => $t->due_date?->toDateString()],
                $link, 'warning', "late:{$t->id}:{$t->due_date?->toDateString()}"));
    }

    private function acceptedInvitations($query, User $user): void
    {
        $query->whereNotNull('accepted_at')
            ->where('accepted_at', '>=', now()->subDays(30))
            ->get()
            ->each(fn (Invitation $i) => $this->notify($user, 'invitation_accepted',
                ['name' => $i->first_name ?: $i->email, 'role' => $i->role], null, 'info', "invitation:{$i->id}"));
    }

    private function criticalTickets(User $user, string $link): void
    {
        Ticket::where('company_id', $user->company_id)
            ->whereIn('status', ['open', 'in_progress'])
            ->where('urgency', 'critical')
            ->get()
            ->each(fn (Ticket $t) => $this->notify($user, 'ticket_critical', ['title' => $t->title], $link, 'critical', "ticket-critical:{$t->id}"));
    }

    /* ---------------- Événements ---------------- */

    public function taskAssigned(Task $task, User $by): void
    {
        $assignee = $task->assignee;
        if (! $assignee || $assignee->id === $by->id) {
            return;
        }
        $base = self::basePath($assignee->role);
        $this->notify($assignee, 'task_assigned',
            ['task' => $task->title, 'project' => $task->project?->name, 'by' => trim("{$by->first_name} {$by->last_name}")],
            $assignee->role === 'agent_support' ? "{$base}/tasks" : $base);
    }

    public function taskCompleted(Task $task, User $by): void
    {
        $chef = $task->project?->chefDeProjet;
        if ($chef && $chef->id !== $by->id) {
            $this->notify($chef, 'task_completed',
                ['task' => $task->title, 'project' => $task->project->name, 'name' => trim("{$by->first_name} {$by->last_name}")],
                '/dashboard/chef/tasks', 'info', "done:{$task->id}");
        }
    }

    public function invitationAccepted(Invitation $invitation, User $user): void
    {
        if ($inviter = User::find($invitation->invited_by)) {
            $this->notify($inviter, 'invitation_accepted',
                ['name' => trim("{$user->first_name} {$user->last_name}"), 'role' => $invitation->role],
                null, 'info', "invitation:{$invitation->id}");
        }
    }

    public function ticketCreated(Ticket $ticket): void
    {
        $agents = User::where('company_id', $ticket->company_id)->where('role', 'agent_support')->get();
        if ($agents->isEmpty()) {
            $agents = User::where('company_id', $ticket->company_id)->where('role', 'direction')->get();
        }
        $critical = $ticket->urgency === 'critical';

        $agents->reject(fn (User $u) => $u->id === $ticket->created_by)
            ->each(fn (User $u) => $this->notify($u, 'ticket_new',
                ['title' => $ticket->title, 'urgency' => $ticket->urgency, 'category' => $ticket->category],
                $u->role === 'direction' ? '/dashboard/direction/support' : '/dashboard/support',
                $critical ? 'critical' : ($ticket->urgency === 'high' ? 'warning' : 'info'),
                // un ticket critique ne doit pas être notifié une 2e fois par le contrôle périodique
                $critical ? "ticket-critical:{$ticket->id}" : "ticket-new:{$ticket->id}"));
    }

    public function ticketAssigned(Ticket $ticket, User $by): void
    {
        $assignee = $ticket->assignee;
        if ($assignee && $assignee->id !== $by->id) {
            $this->notify($assignee, 'ticket_assigned', ['title' => $ticket->title], self::basePath($assignee->role));
        }
    }

    public function ticketReplied(Ticket $ticket, User $author): void
    {
        $client = $ticket->creator;
        if ($client && $client->role === 'client' && $client->id !== $author->id) {
            $this->notify($client, 'ticket_reply',
                ['title' => $ticket->title, 'name' => trim("{$author->first_name} {$author->last_name}")],
                "/dashboard/client/tickets?open={$ticket->id}");

            return;
        }

        // Réponse du client : l'agent assigné, sinon toute l'équipe support
        $targets = $ticket->assignee ? collect([$ticket->assignee])
            : User::where('company_id', $ticket->company_id)->where('role', 'agent_support')->get();
        $targets->reject(fn (User $u) => $u->id === $author->id)
            ->each(fn (User $u) => $this->notify($u, 'ticket_client_reply',
                ['title' => $ticket->title, 'name' => trim("{$author->first_name} {$author->last_name}")],
                $u->role === 'direction' ? '/dashboard/direction/support' : '/dashboard/support', 'warning'));
    }

    public function ticketStatusChanged(Ticket $ticket, User $by): void
    {
        $client = $ticket->creator;
        if ($client && $client->role === 'client' && $client->id !== $by->id && in_array($ticket->status, ['in_progress', 'resolved'], true)) {
            $this->notify($client, $ticket->status === 'resolved' ? 'ticket_resolved' : 'ticket_in_progress',
                ['title' => $ticket->title], "/dashboard/client/tickets?open={$ticket->id}");
        }
    }

    /** Email d'alerte dans la langue de l'utilisateur. */
    private function email(User $user, AppNotification $notification): void
    {
        $previous = App::getLocale();
        App::setLocale($user->locale ?: $previous);

        try {
            $data = $notification->data ?? [];
            [$subject, $message] = match ($notification->type) {
                'project_risk_alert' => [
                    __('Alerte : risque élevé sur le projet :project', ['project' => $data['project'] ?? '']),
                    __('Le projet :project présente un risque :level : dépassement d\'effort estimé à :score % (seuil d\'alerte : :threshold %).', [
                        'project' => $data['project'] ?? '', 'level' => $data['risk_level'] ?? '',
                        'score' => $data['risk_score'] ?? '?', 'threshold' => $data['threshold'] ?? '?',
                    ]),
                ],
                'bankruptcy_alert' => [
                    __('Alerte : risque de faillite élevé'),
                    __('La dernière analyse financière estime la probabilité de faillite à :probability % (seuil d\'alerte : :threshold %). Score de santé : :score/100.', [
                        'probability' => $data['probability'] ?? '?', 'threshold' => $data['threshold'] ?? '?', 'score' => $data['health_score'] ?? '?',
                    ]),
                ],
                default => [
                    __('Nouveau ticket critique : :title', ['title' => $data['title'] ?? '']),
                    __('Un client a ouvert un ticket classé critique : « :title ». Il est en tête de la file de support.', ['title' => $data['title'] ?? '']),
                ],
            };

            $link = rtrim(config('app.frontend_url'), '/') . ($notification->link ?? self::basePath($user->role));
            $html = view('emails.alert', compact('subject', 'message', 'link', 'user'))->render();

            app(BrevoMailService::class)->send($user->email, $subject, $html, trim("{$user->first_name} {$user->last_name}"));
            $notification->update(['emailed_at' => now()]);
        } catch (\Throwable $e) {
            Log::warning('Email d\'alerte non envoyé', ['user' => $user->id, 'error' => $e->getMessage()]);
        } finally {
            App::setLocale($previous);
        }
    }
}
