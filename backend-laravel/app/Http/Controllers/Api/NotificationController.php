<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request, NotificationService $notifications)
    {
        $user = $request->user();

        return response()->json([
            'notifications' => $notifications->for($user),
            'unread' => AppNotification::where('user_id', $user->id)->whereNull('read_at')->count(),
        ]);
    }

    public function markAllRead(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['unread' => 0]);
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return response()->json(['unread' => AppNotification::where('user_id', $request->user()->id)->whereNull('read_at')->count()]);
    }

    public function destroy(Request $request, AppNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->delete();

        return response()->json(['unread' => AppNotification::where('user_id', $request->user()->id)->whereNull('read_at')->count()]);
    }
}
