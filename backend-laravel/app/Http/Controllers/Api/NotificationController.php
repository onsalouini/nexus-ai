<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request, NotificationService $notifications)
    {
        $items = $notifications->for($request->user());

        return response()->json([
            'notifications' => $items,
            'unread' => $items->where('read', false)->count(),
        ]);
    }

    /** Marque tout comme lu (les notifications sont calculées, on mémorise la date de lecture). */
    public function markAllRead(Request $request)
    {
        $request->user()->update(['notifications_read_at' => now()]);

        return response()->json(['unread' => 0]);
    }
}
