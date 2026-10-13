<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/* Photo de profil stockée en base (binaire), servie par GET /api/avatars/{user}. */
class UserAvatar extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    protected $fillable = ['user_id', 'mime', 'hash', 'data'];

    protected $hidden = ['data'];
}
