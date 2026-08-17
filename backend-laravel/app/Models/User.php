<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
    'first_name',
    'last_name',
    'email',
    'password',
    'role',
    'company_id',
    'manager_id',
    'avatar_path',
    'cv_path',
    'job_title',
];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
    public function projectsManaged()
{
    return $this->hasMany(Project::class, 'chef_de_projet_id');
}
public function projects()
{
    return $this->belongsToMany(
        Project::class,
        'project_user'
    )->withTimestamps();
}
public function manager()
{
    return $this->belongsTo(User::class, 'manager_id');
}

public function teamMembers()
{
    return $this->hasMany(User::class, 'manager_id');
}
}
