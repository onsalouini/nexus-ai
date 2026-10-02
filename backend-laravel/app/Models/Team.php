<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = ['company_id', 'chef_id', 'name', 'description', 'color'];

    public function chef() { return $this->belongsTo(User::class, 'chef_id'); }
    public function members() { return $this->belongsToMany(User::class, 'team_user')->withTimestamps(); }
    public function projects() { return $this->hasMany(Project::class); }
}
