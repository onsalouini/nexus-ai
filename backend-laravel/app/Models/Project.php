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
        'ai_report',
        'ai_report_generated_at',
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

        'ai_report' => 'array',
        'ai_report_generated_at' => 'datetime',
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
}