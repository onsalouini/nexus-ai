<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AIConversation extends Model
{
    use HasFactory;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'user_id',
        'title',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(
            AIMessage::class,
            'conversation_id'
        );
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(
            AIAttachment::class,
            'conversation_id'
        );
    }
}