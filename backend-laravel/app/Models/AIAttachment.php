<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAttachment extends Model
{
    use HasFactory;

    protected $table = 'ai_attachments';

    protected $fillable = [
        'conversation_id',
        'message_id',
        'user_id',
        'original_name',
        'file_path',
        'mime_type',
        'file_size',
        'extracted_text',
    ];

    public function conversation()
    {
        return $this->belongsTo(
            AIConversation::class,
            'conversation_id'
        );
    }

    public function message()
    {
        return $this->belongsTo(
            AIMessage::class,
            'message_id'
        );
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}