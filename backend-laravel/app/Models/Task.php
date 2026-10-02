<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'created_by', 'assigned_to', 'title', 'description',
        'status', 'priority', 'estimated_hours', 'spent_hours', 'due_date', 'completed_at',
    ];

    protected $casts = [
        'estimated_hours' => 'float',
        'spent_hours' => 'float',
        'due_date' => 'date:Y-m-d',
        'completed_at' => 'datetime',
    ];

    public const STATUSES = ['todo', 'in_progress', 'review', 'done'];
    public const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    public function project() { return $this->belongsTo(Project::class); }
    public function assignee() { return $this->belongsTo(User::class, 'assigned_to'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
