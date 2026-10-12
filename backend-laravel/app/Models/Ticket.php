<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    public const CATEGORIES = ['bug', 'billing', 'feature', 'account', 'other'];
    public const URGENCIES = ['low', 'medium', 'high', 'critical'];
    public const SENTIMENTS = ['negative', 'neutral', 'positive'];
    public const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

    protected $fillable = [
        'company_id', 'created_by', 'assigned_to', 'title', 'description',
        'customer_name', 'customer_email', 'category', 'urgency', 'sentiment',
        'status', 'classification_corrected', 'resolved_at',
    ];

    protected $casts = [
        'classification_corrected' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
