<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    public const SEVERITIES = ['info', 'warning', 'critical'];

    protected $fillable = ['user_id', 'type', 'severity', 'data', 'link', 'dedupe_key', 'read_at', 'emailed_at'];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'emailed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
