<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\DirectMessage;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/*
| Messagerie interne : qui peut écrire à qui.
|  - direction      ↔ chefs de projet de l'entreprise
|  - chef de projet ↔ direction, ses employés (équipe / projets), les clients de ses projets
|  - employé        ↔ son chef (manager) et les chefs des projets auxquels il participe
|  - client         ↔ les chefs des projets qu'il suit
*/
class MessagingService
{
    public const EMPLOYEE_ROLES = ['membre_equipe', 'agent_support'];

    /** @return Collection<int, User> */
    public function contacts(User $user): Collection
    {
        if (! $user->company_id) {
            return collect();
        }

        $company = User::where('company_id', $user->company_id)->where('id', '!=', $user->id);

        $query = match ($user->role) {
            'direction' => (clone $company)->where('role', 'chef_de_projet'),

            'chef_de_projet' => (clone $company)->where(function ($q) use ($user) {
                $projectIds = Project::where('chef_de_projet_id', $user->id)->pluck('id');
                $q->where('role', 'direction')
                    ->orWhere(fn ($e) => $e->whereIn('role', self::EMPLOYEE_ROLES)->where(fn ($w) => $w
                        ->where('manager_id', $user->id)
                        ->orWhereHas('projects', fn ($p) => $p->whereIn('projects.id', $projectIds))))
                    ->orWhereIn('id', Project::whereIn('id', $projectIds)->whereNotNull('client_id')->pluck('client_id'));
            }),

            'membre_equipe', 'agent_support' => (clone $company)->where('role', 'chef_de_projet')->where(fn ($q) => $q
                ->where('id', $user->manager_id)
                ->orWhereIn('id', $user->projects()->pluck('chef_de_projet_id'))),

            'client' => (clone $company)->where('role', 'chef_de_projet')
                ->whereIn('id', Project::where('client_id', $user->id)->pluck('chef_de_projet_id')),

            default => (clone $company)->whereRaw('1 = 0'),
        };

        return $query->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'role', 'job_title', 'organization', 'avatar_path', 'avatar_color']);
    }

    public function canMessage(User $from, User $to): bool
    {
        return $this->contacts($from)->contains('id', $to->id);
    }

    /** Conversation existante entre les deux utilisateurs, ou nouvelle. */
    public function between(User $a, User $b): Conversation
    {
        $existing = Conversation::whereHas('participants', fn ($q) => $q->where('users.id', $a->id))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $b->id))
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($a, $b) {
            $conversation = Conversation::create();
            $conversation->participants()->attach([$a->id, $b->id]);

            return $conversation;
        });
    }

    public function isParticipant(Conversation $conversation, User $user): bool
    {
        return $conversation->participants()->where('users.id', $user->id)->exists();
    }

    public function markRead(Conversation $conversation, User $user): void
    {
        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
            'last_read_message_id' => DirectMessage::where('conversation_id', $conversation->id)->max('id'),
        ]);
    }

    public function send(Conversation $conversation, User $author, string $body): DirectMessage
    {
        $message = DirectMessage::create(['conversation_id' => $conversation->id, 'user_id' => $author->id, 'body' => $body]);
        $conversation->update(['last_message_at' => $message->created_at]);
        $this->markRead($conversation, $author);

        // Une notification par série de messages non lus (pas une par message)
        $conversation->participants()->where('users.id', '!=', $author->id)->get()->each(function (User $recipient) use ($conversation, $author, $body) {
            $lastRead = $recipient->pivot->last_read_message_id;
            app(NotificationService::class)->notify(
                $recipient,
                'message_new',
                ['name' => trim("{$author->first_name} {$author->last_name}"), 'preview' => mb_strimwidth($body, 0, 80, '…')],
                NotificationService::basePath($recipient->role) . "/messages?c={$conversation->id}",
                'info',
                "msg:{$conversation->id}:" . ($lastRead ?? 'new')
            );
        });

        return $message;
    }

    /** Nombre de messages non lus, toutes conversations confondues. */
    public function unreadCount(User $user): int
    {
        return DirectMessage::join('conversation_user as cu', function ($join) use ($user) {
            $join->on('cu.conversation_id', '=', 'direct_messages.conversation_id')->where('cu.user_id', '=', $user->id);
        })
            ->where('direct_messages.user_id', '!=', $user->id)
            ->whereRaw('direct_messages.id > COALESCE(cu.last_read_message_id, 0)')
            ->count();
    }
}
