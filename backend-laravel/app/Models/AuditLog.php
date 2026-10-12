<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = ['company_id', 'user_id', 'action', 'meta', 'ip'];

    protected $casts = ['meta' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Journalise une action sensible (jamais bloquant pour l'appelant). */
    public static function record(?User $user, string $action, array $meta = [], ?Request $request = null): void
    {
        try {
            static::create([
                'company_id' => $user?->company_id,
                'user_id' => $user?->id,
                'action' => $action,
                'meta' => $meta ?: null,
                'ip' => ($request ?? request())?->ip(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
