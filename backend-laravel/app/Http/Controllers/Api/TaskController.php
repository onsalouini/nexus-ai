<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    private function ownProject(Request $request, int $projectId): Project
    {
        $project = Project::findOrFail($projectId);
        abort_if($project->chef_de_projet_id !== $request->user()->id, 403, 'Projet non autorisé.');
        return $project;
    }

    private function ownTask(Request $request, Task $task): Task
    {
        abort_if($task->project->chef_de_projet_id !== $request->user()->id, 403, 'Tâche non autorisée.');
        return $task;
    }

    /** Un assigné doit appartenir à l'équipe du projet ou à l'équipe du chef. */
    private function assertAssignable(Project $project, ?int $userId, Request $request): void
    {
        if (!$userId) return;
        $allowed = $project->team()->pluck('users.id')
            ->merge($request->user()->teamMembers()->pluck('id'))
            ->push($request->user()->id)
            ->unique();
        abort_unless($allowed->contains($userId), 422, "Ce membre n'appartient pas à votre équipe.");
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

    public function index(Request $request)
    {
        $query = Task::with(['assignee:id,first_name,last_name,job_title', 'project:id,name'])
            ->whereHas('project', fn ($q) => $q->where('chef_de_projet_id', $request->user()->id));

        if ($request->filled('project_id')) $query->where('project_id', $request->project_id);
        if ($request->filled('assigned_to')) $query->where('assigned_to', $request->assigned_to);
        if ($request->filled('status')) $query->where('status', $request->status);

        return response()->json(['tasks' => $query->orderByRaw(
            "CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END"
        )->latest()->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(Task::STATUSES)],
            'priority' => ['nullable', Rule::in(Task::PRIORITIES)],
            'estimated_hours' => 'nullable|numeric|min:0',
            'spent_hours' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $project = $this->ownProject($request, $data['project_id']);
        $this->assertAssignable($project, $data['assigned_to'] ?? null, $request);

        $task = Task::create([
            ...$data,
            'created_by' => $request->user()->id,
            'completed_at' => ($data['status'] ?? 'todo') === 'done' ? now() : null,
        ]);

        $project->recalculateProgress();
        $this->log($project, $request, 'task_created', "Tâche « {$task->title} » créée");

        return response()->json($task->load('assignee:id,first_name,last_name,job_title', 'project:id,name'), 201);
    }

    public function update(Request $request, Task $task)
    {
        $this->ownTask($request, $task);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:200',
            'description' => 'nullable|string',
            'status' => ['sometimes', Rule::in(Task::STATUSES)],
            'priority' => ['sometimes', Rule::in(Task::PRIORITIES)],
            'estimated_hours' => 'nullable|numeric|min:0',
            'spent_hours' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $project = $task->project;
        if (array_key_exists('assigned_to', $data)) {
            $this->assertAssignable($project, $data['assigned_to'], $request);
        }

        $oldStatus = $task->status;
        $oldAssignee = $task->assigned_to;

        if (isset($data['status'])) {
            $data['completed_at'] = $data['status'] === 'done' ? ($task->completed_at ?? now()) : null;
        }

        $task->update($data);
        $project->recalculateProgress();

        if ($oldStatus !== $task->status) {
            $this->log($project, $request, 'task_status', "« {$task->title} » : {$oldStatus} → {$task->status}");
        }
        if ($oldAssignee !== $task->assigned_to) {
            $name = $task->assignee ? $task->assignee->first_name . ' ' . $task->assignee->last_name : 'personne';
            $this->log($project, $request, 'task_assigned', "« {$task->title} » assignée à {$name}");
        }

        return response()->json($task->fresh()->load('assignee:id,first_name,last_name,job_title', 'project:id,name'));
    }

    public function destroy(Request $request, Task $task)
    {
        $this->ownTask($request, $task);
        $project = $task->project;
        $title = $task->title;
        $task->delete();
        $project->recalculateProgress();
        $this->log($project, $request, 'task_deleted', "Tâche « {$title} » supprimée");

        return response()->json(['message' => 'Tâche supprimée.']);
    }
}
