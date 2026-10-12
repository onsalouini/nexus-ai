<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    // job_title et project_id manquaient : ils étaient ignorés à la création
    protected $fillable = ['email', 'first_name', 'role', 'job_title', 'project_id', 'token', 'company_id', 'invited_by', 'expires_at', 'locale'];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isValid(): bool
    {
        return is_null($this->accepted_at) && $this->expires_at->isFuture();
    }
    public function project()
{
    return $this->belongsTo(Project::class);
}
}