<?php

namespace App\Models;
use App\Models\AIAttachment;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIConversation extends Model
{
    use HasFactory;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'user_id',
        'title',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(AIMessage::class, 'conversation_id');
    }
public function attachments()
{
    return $this->hasMany(AIAttachment::class, 'conversation_id');
}
}