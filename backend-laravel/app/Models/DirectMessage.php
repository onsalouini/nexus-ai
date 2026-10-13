<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DirectMessage extends Model
{
    protected $fillable = ['conversation_id', 'user_id', 'body'];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
