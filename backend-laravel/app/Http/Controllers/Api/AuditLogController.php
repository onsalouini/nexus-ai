<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

/* Journal d'audit de l'entreprise (direction uniquement, via le middleware de rôle). */
class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,first_name,last_name,email,role')
            ->where('company_id', $request->user()->company_id)
            ->latest('id');

        if ($request->filled('action')) {
            $query->where('action', 'like', $request->action . '%');
        }

        return response()->json($query->paginate(25));
    }
}
