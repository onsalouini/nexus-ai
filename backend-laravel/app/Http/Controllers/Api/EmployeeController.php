<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/*
| Espace employé (membre d'équipe / agent support) :
| ses tâches assignées et les projets auxquels il participe.
*/
class EmployeeController extends Controller
{
    public function tasks(Request $request)
    {
        $query = Task::with(['project:id,name,deadline', 'creator:id,first_name,last_name'])
            ->where('assigned_to', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'tasks' => $query
                ->orderByRaw("CASE status WHEN 'done' THEN 1 ELSE 0 END")
                ->orderByRaw('due_date IS NULL, due_date')
                ->get(),
        ]);
    }

    /** L'employé ne peut modifier que l'avancement de SES tâches (statut, heures passées). */
    public function updateTask(Request $request, Task $task)
    {
        abort_unless($task->assigned_to === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Task::STATUSES)],
            'spent_hours' => 'sometimes|numeric|min:0',
        ]);

        $oldStatus = $task->status;
        if (isset($data['status'])) {
            $data['completed_at'] = $data['status'] === 'done' ? ($task->completed_at ?? now()) : null;
        }

        $task->update($data);
        $task->project->recalculateProgress();

        if ($oldStatus !== $task->status && $task->status === 'done') {
            app(\App\Services\NotificationService::class)->taskCompleted($task, $request->user());
        }

        if ($oldStatus !== $task->status) {
            ProjectActivity::create([
                'project_id' => $task->project_id,
                'user_id' => $request->user()->id,
                'type' => 'task_status',
                'message' => "« {$task->title} » : {$oldStatus} → {$task->status}",
            ]);
        }

        return response()->json($task->fresh()->load('project:id,name,deadline'));
    }

    public function projects(Request $request)
    {
        $user = $request->user();

        $projects = Project::with('chefDeProjet:id,first_name,last_name,email')
            ->where(function ($q) use ($user) {
                $q->whereHas('team', fn ($t) => $t->where('users.id', $user->id))
                    ->orWhereHas('tasks', fn ($t) => $t->where('assigned_to', $user->id));
            })
            ->withCount([
                'tasks as my_open_tasks' => fn ($q) => $q->where('assigned_to', $user->id)->where('status', '!=', 'done'),
                'tasks as my_done_tasks' => fn ($q) => $q->where('assigned_to', $user->id)->where('status', 'done'),
            ])
            ->latest()
            ->get(['id', 'name', 'description', 'status', 'progress', 'start_date', 'deadline', 'chef_de_projet_id']);

        return response()->json(['projects' => $projects]);
    }
}
