<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    protected $fillable = ['email', 'first_name', 'role', 'token', 'company_id', 'invited_by', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
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