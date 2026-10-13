<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\RiskAlertService;
use Illuminate\Http\Request;

/* Alertes de risque projet / faillite (bandeau des tableaux de bord) et seuils de l'entreprise. */
class AlertController extends Controller
{
    public function index(Request $request, RiskAlertService $alerts)
    {
        return response()->json($alerts->active($request->user()));
    }

    /** Seuils d'alerte (direction uniquement). */
    public function updateSettings(Request $request)
    {
        $user = $request->user();
        abort_unless($user->role === 'direction' && $user->company, 403);

        $data = $request->validate([
            'risk_alert_threshold' => 'required|integer|min:5|max:100',
            'bankruptcy_alert_threshold' => 'required|integer|min:5|max:95',
        ]);
        $user->company->update($data);
        AuditLog::record($user, 'alerts.thresholds_updated', $data, $request);

        return response()->json(RiskAlertService::thresholds($user->company->fresh()));
    }
}
