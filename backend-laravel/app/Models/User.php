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
    'phone',
    'bio',
    'weekly_capacity',
    'locale',
    'notifications_read_at',
    'two_factor_secret',
    'two_factor_enabled_at',
];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    // Exposé au frontend (sans jamais renvoyer le secret)
    protected $appends = ['two_factor_enabled'];

    public function getTwoFactorEnabledAttribute(): bool
    {
        return ! is_null($this->two_factor_enabled_at);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notifications_read_at' => 'datetime',
            'two_factor_enabled_at' => 'datetime',
            'two_factor_secret' => 'encrypted',
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
public function aiConversations()
{
    return $this->hasMany(AIConversation::class);
}

public function tasks()
{
    return $this->hasMany(Task::class, 'assigned_to');
}
public function teams()
{
    return $this->belongsToMany(Team::class, 'team_user')->withTimestamps();
}
}
