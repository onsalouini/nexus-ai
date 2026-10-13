<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\DirectMessage;
use App\Models\User;
use App\Services\MessagingService;
use Illuminate\Http\Request;

/* Messagerie interne : contacts autorisés, conversations, messages. */
class MessageController extends Controller
{
    private const PERSON = ['id', 'first_name', 'last_name', 'role', 'job_title', 'organization', 'avatar_path', 'avatar_color'];

    public function __construct(private MessagingService $messaging) {}

    public function contacts(Request $request)
    {
        return response()->json($this->messaging->contacts($request->user()));
    }

    public function conversations(Request $request)
    {
        $user = $request->user();

        $conversations = $user->conversations()
            ->with(['participants:' . collect(self::PERSON)->map(fn ($c) => "users.$c")->implode(','), 'latestMessage'])
            ->whereNotNull('last_message_at')
            ->orderByDesc('last_message_at')
            ->get();

        // Non lus de toutes les conversations en une seule requête
        $unread = $this->unreadByConversation($user);

        return response()->json([
            'conversations' => $conversations->map(fn (Conversation $c) => $this->summary($c, $user, (int) ($unread[$c->id] ?? 0)))->values(),
            'unread' => (int) $unread->sum(),
        ]);
    }

    /** Ouvre (ou crée) la conversation avec un contact autorisé. */
    public function start(Request $request)
    {
        $data = $request->validate(['user_id' => 'required|integer|exists:users,id']);
        $user = $request->user();
        $other = User::findOrFail($data['user_id']);
        abort_unless($this->messaging->canMessage($user, $other), 403, __('Vous ne pouvez pas écrire à cette personne.'));

        $conversation = $this->messaging->between($user, $other);
        $conversation->load('participants', 'latestMessage');

        return response()->json($this->summary($conversation, $user, (int) ($this->unreadByConversation($user)[$conversation->id] ?? 0)));
    }

    /*
    | Appelée toutes les quelques secondes par la conversation ouverte : 3 requêtes au plus
    | (participants, messages, et la mise à jour « lu » seulement s'il y a du nouveau).
    */
    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $participants = $conversation->participants()->get(array_map(fn ($c) => "users.$c", self::PERSON));
        $me = $participants->firstWhere('id', $user->id);
        abort_unless($me, 403);
        $other = $participants->firstWhere('id', '!=', $user->id);

        $messages = DirectMessage::where('conversation_id', $conversation->id)
            ->when($request->filled('after'), fn ($q) => $q->where('id', '>', (int) $request->after))
            ->orderByDesc('id')
            ->limit(200)
            ->get(['id', 'conversation_id', 'user_id', 'body', 'created_at'])
            ->reverse()
            ->values();

        $latest = $messages->max('id');
        if ($latest && $latest > (int) $me->pivot->last_read_message_id) {
            $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now(), 'last_read_message_id' => $latest]);
        }

        return response()->json([
            'conversation' => ['id' => $conversation->id, 'other' => $other?->only(self::PERSON)],
            // Dernier message lu par l'autre participant : affichage « Vu »
            'other_read_id' => $other?->pivot->last_read_message_id,
            'messages' => $messages,
        ]);
    }

    public function send(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($this->messaging->isParticipant($conversation, $user), 403);
        $data = $request->validate(['body' => 'required|string|max:5000']);

        $other = $conversation->participants()->where('users.id', '!=', $user->id)->first();
        abort_unless($other && $this->messaging->canMessage($user, $other), 403, __('Vous ne pouvez pas écrire à cette personne.'));

        return response()->json($this->messaging->send($conversation, $user, trim($data['body'])), 201);
    }

    public function unread(Request $request)
    {
        return response()->json(['unread' => $this->messaging->unreadCount($request->user())]);
    }

    private function unreadByConversation(User $user)
    {
        return DirectMessage::join('conversation_user as cu', function ($join) use ($user) {
            $join->on('cu.conversation_id', '=', 'direct_messages.conversation_id')->where('cu.user_id', '=', $user->id);
        })
            ->where('direct_messages.user_id', '!=', $user->id)
            ->whereRaw('direct_messages.id > COALESCE(cu.last_read_message_id, 0)')
            ->groupBy('direct_messages.conversation_id')
            ->selectRaw('direct_messages.conversation_id, count(*) as total')
            ->pluck('total', 'conversation_id');
    }

    private function summary(Conversation $c, User $user, int $unread): array
    {
        $other = $c->participants->firstWhere('id', '!=', $user->id);
        $last = $c->latestMessage;

        return [
            'id' => $c->id,
            'other' => $other?->only(self::PERSON),
            'last_message' => $last ? ['body' => $last->body, 'user_id' => $last->user_id, 'created_at' => $last->created_at->toIso8601String()] : null,
            'unread' => $unread,
        ];
    }
}
