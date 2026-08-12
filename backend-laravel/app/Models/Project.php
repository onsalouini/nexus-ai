<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name', 'description', 'company_id', 'chef_de_projet_id', 'status',
        'team_exp', 'manager_exp', 'length', 'transactions', 'entities',
        'points_non_adjust', 'adjustment', 'points_adjust', 'language', 'planned_effort',
        'predicted_effort', 'risk_score', 'risk_level',
    ];

    public function chefDeProjet()
    {
        return $this->belongsTo(User::class, 'chef_de_projet_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}