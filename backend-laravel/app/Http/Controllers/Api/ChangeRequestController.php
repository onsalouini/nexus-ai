<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChangeRequest;
use App\Models\ProjectActivity;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/* Chef de projet : demandes de changement envoyées par les clients de ses projets. */
class ChangeRequestController extends Controller
{
    public function index(Request $request)
    {
        $requests = ChangeRequest::with(['project:id,name', 'client:id,first_name,last_name,email,organization,avatar_path,avatar_color'])
            ->whereHas('project', fn ($q) => $q->where('chef_de_projet_id', $request->user()->id))
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END")
            ->latest()
            ->get();

        return response()->json([
            'requests' => $requests,
            'pending' => $requests->where('status', 'pending')->count(),
        ]);
    }

    public function update(Request $request, ChangeRequest $changeRequest, NotificationService $notifications)
    {
        $user = $request->user();
        abort_unless($changeRequest->project->chef_de_projet_id === $user->id, 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(ChangeRequest::STATUSES)],
            'response' => 'nullable|string|max:5000',
        ]);

        $changeRequest->update([...$data, 'responded_by' => $user->id, 'responded_at' => now()]);

        ProjectActivity::create([
            'project_id' => $changeRequest->project_id,
            'user_id' => $user->id,
            'type' => 'change_request',
            'message' => "Demande client « {$changeRequest->title} » : {$data['status']}",
        ]);

        if ($client = $changeRequest->client) {
            $notifications->notify($client, 'change_request_updated',
                ['title' => $changeRequest->title, 'status' => $data['status'], 'project' => $changeRequest->project->name],
                "/dashboard/client/projects/{$changeRequest->project_id}");
        }

        return response()->json($changeRequest->fresh()->load(['project:id,name', 'client:id,first_name,last_name,email,organization,avatar_path,avatar_color']));
    }
}
