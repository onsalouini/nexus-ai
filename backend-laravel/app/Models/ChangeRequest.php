<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/* Demande de changement envoyée par le client au chef de projet. */
class ChangeRequest extends Model
{
    public const PRIORITIES = ['low', 'normal', 'high'];
    public const STATUSES = ['pending', 'accepted', 'in_progress', 'done', 'rejected'];

    protected $fillable = [
        'project_id', 'client_id', 'title', 'description', 'priority',
        'status', 'response', 'responded_by', 'responded_at',
    ];

    protected $casts = ['responded_at' => 'datetime'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}
