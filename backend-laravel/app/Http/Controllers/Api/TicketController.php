<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Services\TicketTriageService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/*
| File de tickets support, triée automatiquement par urgence et sentiment.
| Accessible aux agents support et à la direction de l'entreprise.
*/
class TicketController extends Controller
{
    private function own(Request $request, Ticket $ticket): Ticket
    {
        abort_unless($ticket->company_id === $request->user()->company_id, 403);

        return $ticket;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with('assignee:id,first_name,last_name')
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

    public function store(Request $request, TicketTriageService $triage)
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

        return response()->json($ticket->load('assignee:id,first_name,last_name'), 201);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->own($request, $ticket);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Ticket::STATUSES)],
            'assigned_to' => 'nullable|exists:users,id',
            'category' => ['sometimes', Rule::in(Ticket::CATEGORIES)],
            'urgency' => ['sometimes', Rule::in(Ticket::URGENCIES)],
            'sentiment' => ['sometimes', Rule::in(Ticket::SENTIMENTS)],
        ]);

        // Correction manuelle du tri automatique : conservée pour améliorer le modèle
        if (array_intersect(['category', 'urgency', 'sentiment'], array_keys($data))) {
            $data['classification_corrected'] = true;
        }

        if (array_key_exists('assigned_to', $data) && $data['assigned_to']) {
            $assignee = \App\Models\User::find($data['assigned_to']);
            abort_unless($assignee && $assignee->company_id === $ticket->company_id, 422);
        }

        if (isset($data['status'])) {
            $data['resolved_at'] = in_array($data['status'], ['resolved', 'closed'], true) ? ($ticket->resolved_at ?? now()) : null;
        }

        $ticket->update($data);

        if (isset($data['status']) && $data['status'] === 'resolved') {
            AuditLog::record($request->user(), 'ticket.resolved', ['ticket' => $ticket->id, 'title' => $ticket->title]);
        }

        return response()->json($ticket->fresh()->load('assignee:id,first_name,last_name'));
    }
}
