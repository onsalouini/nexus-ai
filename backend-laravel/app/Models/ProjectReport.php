<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectReport extends Model
{
    protected $fillable = [
        'project_id', 'generated_by', 'trigger', 'report',
        'planned_effort', 'predicted_effort', 'risk_level', 'risk_score',
    ];

    protected $casts = [
        'report' => 'array',
        'planned_effort' => 'float',
        'predicted_effort' => 'float',
        'risk_score' => 'float',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
