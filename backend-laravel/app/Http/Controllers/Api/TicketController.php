<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\TicketReplyService;
use App\Services\TicketTriageService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/*
| File de tickets support, triée automatiquement (modèle ML) par urgence et sentiment.
| Accessible aux agents support et à la direction de l'entreprise.
| Les tickets ouverts par un client depuis son espace ont un fil de discussion.
*/
class TicketController extends Controller
{
    public const WITH = [
        'assignee:id,first_name,last_name,avatar_path,avatar_color',
        'creator:id,first_name,last_name,role,avatar_path,avatar_color',
        'project:id,name',
    ];

    private function own(Request $request, Ticket $ticket): Ticket
    {
        abort_unless($ticket->company_id === $request->user()->company_id, 403);

        return $ticket;
    }

    public static function detail(Ticket $ticket): Ticket
    {
        return $ticket->load([...self::WITH, 'messages.author:id,first_name,last_name,role,avatar_path,avatar_color'])->loadCount('messages');
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with(self::WITH)->withCount('messages')
            ->where('company_id', $user->company_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', ['open', 'in_progress']);
        }
        if ($request->boolean('mine')) {
            $query->where('assigned_to', $user->id);
        }

        $tickets = $query
            ->orderByRaw("CASE urgency WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END")
            ->orderByRaw("CASE sentiment WHEN 'negative' THEN 0 WHEN 'neutral' THEN 1 ELSE 2 END")
            ->oldest()
            ->get();

        $all = Ticket::where('company_id', $user->company_id);

        return response()->json([
            'tickets' => $tickets,
            'stats' => [
                'open' => (clone $all)->where('status', 'open')->count(),
                'in_progress' => (clone $all)->where('status', 'in_progress')->count(),
                'resolved' => (clone $all)->whereIn('status', ['resolved', 'closed'])->count(),
                'critical_open' => (clone $all)->whereIn('status', ['open', 'in_progress'])->where('urgency', 'critical')->count(),
                'mine' => (clone $all)->whereIn('status', ['open', 'in_progress'])->where('assigned_to', $user->id)->count(),
            ],
        ]);
    }

    public function show(Request $request, Ticket $ticket)
    {
        return response()->json(self::detail($this->own($request, $ticket)));
    }

    public function store(Request $request, TicketTriageService $triage, NotificationService $notifications)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:5000',
            'customer_name' => 'nullable|string|max:150',
            'customer_email' => 'nullable|email',
        ]);

        $user = $request->user();
        abort_if(is_null($user->company_id), 422, __('Configurez d\'abord votre entreprise.'));

        $ticket = Ticket::create([
            ...$data,
            ...$triage->classify($data['title'], $data['description']),
            'company_id' => $user->company_id,
            'created_by' => $user->id,
        ]);
        $notifications->ticketCreated($ticket);

        return response()->json(self::detail($ticket), 201);
    }

    public function update(Request $request, Ticket $ticket, NotificationService $notifications)
    {
        $this->own($request, $ticket);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Ticket::STATUSES)],
            'assigned_to' => 'nullable|exists:users,id',
            'category' => ['sometimes', Rule::in(Ticket::CATEGORIES)],
            'urgency' => ['sometimes', Rule::in(Ticket::URGENCIES)],
            'sentiment' => ['sometimes', Rule::in(Ticket::SENTIMENTS)],
        ]);

        // Correction manuelle du tri automatique : conservée pour ré-entraîner le modèle
        if (array_intersect(['category', 'urgency', 'sentiment'], array_keys($data))) {
            $data['classification_corrected'] = true;
        }

        if (array_key_exists('assigned_to', $data) && $data['assigned_to']) {
            $assignee = User::find($data['assigned_to']);
            abort_unless($assignee && $assignee->company_id === $ticket->company_id, 422);
        }

        if (isset($data['status'])) {
            $data['resolved_at'] = in_array($data['status'], ['resolved', 'closed'], true) ? ($ticket->resolved_at ?? now()) : null;
        }

        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assigned_to;
        $ticket->update($data);
        $ticket->load(self::WITH);

        if ($oldAssignee !== $ticket->assigned_to) {
            $notifications->ticketAssigned($ticket, $request->user());
        }
        if ($oldStatus !== $ticket->status) {
            $notifications->ticketStatusChanged($ticket, $request->user());
        }
        if (isset($data['status']) && $data['status'] === 'resolved') {
            AuditLog::record($request->user(), 'ticket.resolved', ['ticket' => $ticket->id, 'title' => $ticket->title]);
        }

        return response()->json(self::detail($ticket));
    }

    /** Réponse de l'agent dans le fil du ticket (visible par le client). */
    public function reply(Request $request, Ticket $ticket, NotificationService $notifications)
    {
        $this->own($request, $ticket);
        $data = $request->validate(['body' => 'required|string|max:5000']);
        $user = $request->user();

        TicketMessage::create(['ticket_id' => $ticket->id, 'user_id' => $user->id, 'body' => $data['body']]);

        // Première réponse : le ticket passe en cours et revient à l'agent qui répond
        $ticket->update([
            'status' => $ticket->status === 'open' ? 'in_progress' : $ticket->status,
            'assigned_to' => $ticket->assigned_to ?? $user->id,
        ]);
        $notifications->ticketReplied($ticket->load(self::WITH), $user);

        return response()->json(self::detail($ticket), 201);
    }

    /** Brouillon de réponse rédigé par l'IA, à relire avant envoi. */
    public function suggestReply(Request $request, Ticket $ticket, TicketReplyService $replies)
    {
        $this->own($request, $ticket);

        return response()->json(['reply' => $replies->suggest(self::detail($ticket), $request->user())]);
    }

    /** État du modèle ML de tri (version, précision). */
    public function modelStatus(Request $request, TicketTriageService $triage)
    {
        $companyId = $request->user()->company_id;

        return response()->json([
            'model' => $triage->modelStatus(),
            'corrections' => Ticket::where('company_id', $companyId)->where('classification_corrected', true)->count(),
            'sources' => Ticket::where('company_id', $companyId)->selectRaw('triage_source, count(*) as total')
                ->groupBy('triage_source')->pluck('total', 'triage_source'),
        ]);
    }

    /** Ré-entraîne le modèle avec les corrections des agents (boucle de feedback). */
    public function retrain(Request $request, TicketTriageService $triage)
    {
        $samples = Ticket::where('company_id', $request->user()->company_id)
            ->where('classification_corrected', true)
            ->get(['title', 'description', 'category', 'urgency', 'sentiment'])
            ->toArray();

        try {
            $model = $triage->retrain($samples);
        } catch (\Throwable $e) {
            report($e);
            $model = null;
        }
        abort_unless($model, 503, __('Le service de tri des tickets est indisponible.'));

        AuditLog::record($request->user(), 'tickets.model_retrained', ['samples' => count($samples)]);

        return response()->json(['model' => $model, 'samples' => count($samples)]);
    }
}
