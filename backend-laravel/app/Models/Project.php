<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name',
        'description',
        'company_id',
        'chef_de_projet_id',
        'status',
        'team_exp',
        'manager_exp',
        'length',
        'transactions',
        'entities',
        'points_non_adjust',
        'adjustment',
        'points_adjust',
        'language',
        'planned_effort',
        'predicted_effort',
        'risk_score',
        'risk_level',
        'risk_explanation',
        'ai_report',
        'ai_report_generated_at',
        'start_date',
        'deadline',
        'progress',
        'team_id',
    ];

    protected $casts = [
        'team_exp' => 'float',
        'manager_exp' => 'float',
        'length' => 'float',
        'transactions' => 'float',
        'entities' => 'float',
        'points_non_adjust' => 'float',
        'adjustment' => 'float',
        'points_adjust' => 'float',
        'planned_effort' => 'float',
        'predicted_effort' => 'float',
        'risk_score' => 'float',

        'risk_explanation' => 'array',
        'ai_report' => 'array',
        'ai_report_generated_at' => 'datetime',
        'start_date' => 'date:Y-m-d',
        'deadline' => 'date:Y-m-d',
        'progress' => 'integer',
    ];

    public function chefDeProjet()
    {
        return $this->belongsTo(User::class, 'chef_de_projet_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function team()
    {
        return $this->belongsToMany(
            User::class,
            'project_user'
        )->withTimestamps();
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function activities()
    {
        return $this->hasMany(ProjectActivity::class)->latest();
    }

    public function teamGroup()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    /**
     * Recalcule l'avancement (pondéré par les heures estimées) et met à jour le statut.
     */
    public function recalculateProgress(): void
    {
        $tasks = $this->tasks()->get();

        if ($tasks->isEmpty()) {
            return;
        }

        $totalWeight = $tasks->sum(fn ($t) => max($t->estimated_hours, 1));
        $doneWeight = $tasks->where('status', 'done')->sum(fn ($t) => max($t->estimated_hours, 1));
        $inProgressWeight = $tasks->whereIn('status', ['in_progress', 'review'])
            ->sum(fn ($t) => max($t->estimated_hours, 1) * ($t->status === 'review' ? 0.8 : 0.4));

        $progress = (int) round((($doneWeight + $inProgressWeight) / $totalWeight) * 100);
        $progress = min(100, $progress);

        $allDone = $tasks->every(fn ($t) => $t->status === 'done');

        $status = $this->status;
        if ($allDone) {
            $status = 'termine';
            $progress = 100;
        } elseif ($tasks->contains(fn ($t) => $t->status !== 'todo') && $status !== 'suspendu') {
            $status = 'en_cours';
        } elseif ($this->status === 'termine') {
            $status = 'en_cours';
        }

        $this->update(['progress' => $progress, 'status' => $status]);
    }
}
