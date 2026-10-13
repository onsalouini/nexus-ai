<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/* Conversation privée entre deux utilisateurs (messagerie interne). */
class Conversation extends Model
{
    protected $fillable = ['last_message_at'];

    protected $casts = ['last_message_at' => 'datetime'];

    public function participants()
    {
        return $this->belongsToMany(User::class)->withPivot('last_read_at', 'last_read_message_id');
    }

    public function messages()
    {
        return $this->hasMany(DirectMessage::class);
    }

    public function latestMessage()
    {
        return $this->hasOne(DirectMessage::class)->latestOfMany();
    }
}
