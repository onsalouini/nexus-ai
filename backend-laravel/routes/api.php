<?php
use App\Http\Controllers\DirectorTeamController;
use App\Http\Controllers\DirectorProjectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\FinancialHealthController;
use App\Http\Controllers\ChefTeamController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\Api\AIConversationController;
use App\Http\Controllers\Api\AIConversationMessageController;
use App\Http\Controllers\Api\AIAttachmentController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\ProjectTrackingController;
use App\Http\Controllers\DirectorDashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\HealthScoreController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientManagementController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ChangeRequestController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/me', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::post('/auth/send-code', [AuthController::class, 'sendVerificationCode']);
Route::post('/register', [AuthController::class, 'register']);
// 5 tentatives par minute et par IP
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/auth/verify-code', [AuthController::class, 'verifyCode']);
// Second facteur (TOTP) après un login qui a renvoyé two_factor_required
Route::post('/auth/2fa/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:5,1');
Route::get('/invitations/validate/{token}', [InvitationController::class, 'validateToken']);
// Photo de profil stockée en base (publique : chargée par des balises <img>)
Route::get('/avatars/{userId}', [AccountController::class, 'avatar'])->whereNumber('userId');

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Tous les utilisateurs connectés
    |--------------------------------------------------------------------------
    */
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/onboarding/company', [AuthController::class, 'setupCompany']);
    Route::post('/company', [AuthController::class, 'setupCompany']);

    // Paramètres de compte
    Route::get('/account', [AccountController::class, 'show']);
    Route::put('/account/profile', [AccountController::class, 'updateProfile']);
    Route::post('/account/avatar', [AccountController::class, 'updateAvatar']);
    Route::delete('/account/avatar', [AccountController::class, 'removeAvatar']);
    Route::put('/account/preferences', [AccountController::class, 'updatePreferences']);
    Route::put('/account/password', [AccountController::class, 'updatePassword']);
    Route::put('/account/company', [AccountController::class, 'updateCompany']); // réservé direction (contrôleur)
    Route::put('/account/locale', [AccountController::class, 'updateLocale']);
    Route::post('/account/2fa/setup', [AccountController::class, 'setupTwoFactor']);
    Route::post('/account/2fa/enable', [AccountController::class, 'enableTwoFactor']);
    Route::post('/account/2fa/disable', [AccountController::class, 'disableTwoFactor']);

    // Notifications calculées selon le rôle
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Messagerie interne (le service limite les contacts selon le rôle)
    Route::get('/messages/contacts', [MessageController::class, 'contacts']);
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::post('/messages/conversations', [MessageController::class, 'start']);
    Route::get('/messages/conversations/{conversation}', [MessageController::class, 'show']);
    Route::post('/messages/conversations/{conversation}', [MessageController::class, 'send'])->middleware('throttle:60,1');
    Route::get('/messages/unread', [MessageController::class, 'unread']);

    /*
    |--------------------------------------------------------------------------
    | Direction uniquement
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:direction')->group(function () {
        Route::get('/director/dashboard', [DirectorDashboardController::class, 'index']);
        Route::get('/director/projects', [DirectorProjectController::class, 'index']);
        Route::get('/director/projects/{project}', [DirectorProjectController::class, 'show']);
        Route::get('/director/team', [DirectorTeamController::class, 'index']);
        Route::get('/director/team/{member}', [DirectorTeamController::class, 'show']);
        Route::get('/director/health-score', [HealthScoreController::class, 'index']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::put('/alerts/settings', [AlertController::class, 'updateSettings']);
        Route::post('/tickets/model/retrain', [TicketController::class, 'retrain']);

        Route::post('/financial-health/predict', [FinancialHealthController::class, 'predict']);
        Route::post('/financial-health/explain', [FinancialHealthController::class, 'explain']);
        Route::post('/financial-health/store', [FinancialHealthController::class, 'store']);
        Route::get('/financial-health/history', [FinancialHealthController::class, 'history']);
        Route::get('/financial-health/reports/{report}', [FinancialHealthController::class, 'show']);
        Route::get('/financial-health/reports/{report}/download', [FinancialHealthController::class, 'download']);
    });

    /*
    |--------------------------------------------------------------------------
    | Chef de projet uniquement
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:chef_de_projet')->group(function () {
        // Doit rester AVANT apiResource, sinon "risk-predictions" est lu comme {project}
        Route::get('/projects/risk-predictions', [ProjectController::class, 'riskPredictions']);
        Route::apiResource('/projects', ProjectController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

        Route::get('/chef/team', [ChefTeamController::class, 'index']);
        Route::post('/chef/team', [ChefTeamController::class, 'store']);
        Route::put('/chef/team/{member}', [ChefTeamController::class, 'update']);
        Route::delete('/chef/team/{member}', [ChefTeamController::class, 'destroy']);

        // Équipes nommées
        Route::get('/chef/teams', [TeamController::class, 'index']);
        Route::post('/chef/teams', [TeamController::class, 'store']);
        Route::put('/chef/teams/{team}', [TeamController::class, 'update']);
        Route::delete('/chef/teams/{team}', [TeamController::class, 'destroy']);

        // Tâches
        Route::get('/tasks', [TaskController::class, 'index']);
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::put('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

        // Suivi de projet
        Route::get('/tracking/overview', [ProjectTrackingController::class, 'overview']);
        Route::get('/tracking/projects/{project}', [ProjectTrackingController::class, 'show']);
        Route::post('/projects/{project}/members', [ProjectTrackingController::class, 'addMember']);
        Route::delete('/projects/{project}/members/{user}', [ProjectTrackingController::class, 'removeMember']);
        Route::put('/projects/{project}/team', [ProjectTrackingController::class, 'assignTeam']);
        Route::post('/projects/{project}/auto-assign', [ProjectTrackingController::class, 'autoAssign']);
        Route::post('/projects/{project}/generate-tasks', [ProjectTrackingController::class, 'generateTasks']);

        // Demandes de changement des clients
        Route::get('/chef/change-requests', [ChangeRequestController::class, 'index']);
        Route::patch('/chef/change-requests/{changeRequest}', [ChangeRequestController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | Direction + chef de projet
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:direction,chef_de_projet')->group(function () {
        // Le contrôleur limite les rôles qu'un chef peut inviter
        Route::post('/invitations', [InvitationController::class, 'store']);
        Route::get('/invitations', [InvitationController::class, 'index']);
        Route::post('/invitations/{invitation}/resend', [InvitationController::class, 'resend']);
        Route::delete('/invitations/{invitation}', [InvitationController::class, 'destroy']);

        // Le contrôleur vérifie propriétaire ou direction de l'entreprise
        Route::post('/projects/{project}/generate-report', [ProjectController::class, 'generateReport']);
        Route::get('/projects/{project}/reports', [ProjectController::class, 'reports']);

        Route::post('/ai/chat', [AIChatController::class, 'chat']);
        Route::get('/ai/conversations', [AIConversationController::class, 'index']);
        Route::post('/ai/conversations', [AIConversationController::class, 'store']);
        Route::get('/ai/conversations/{conversation}', [AIConversationController::class, 'show']);
        Route::post('/ai/conversations/{conversation}/messages', [AIConversationMessageController::class, 'store']);
        Route::post('/ai/conversations/{conversation}/attachments', [AIAttachmentController::class, 'store']);

        Route::post('/risk-predictions/test', [ProjectController::class, 'testPrediction']);

        // Alertes de risque projet / faillite
        Route::get('/alerts', [AlertController::class, 'index']);

        // Comptes clients et rattachement aux projets
        Route::get('/clients', [ClientManagementController::class, 'index']);
        Route::put('/projects/{project}/client', [ClientManagementController::class, 'assign']);
        Route::get('/ai/model-status', [ProjectController::class, 'modelStatus']);
    });

    /*
    |--------------------------------------------------------------------------
    | Employés (agent support, membre d'équipe)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:agent_support,membre_equipe')->group(function () {
        Route::get('/me/tasks', [EmployeeController::class, 'tasks']);
        Route::patch('/me/tasks/{task}', [EmployeeController::class, 'updateTask']);
        Route::get('/me/projects', [EmployeeController::class, 'projects']);
    });

    /*
    |--------------------------------------------------------------------------
    | Support client : agents + direction
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:agent_support,direction')->group(function () {
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::get('/tickets/model', [TicketController::class, 'modelStatus']);
        Route::get('/tickets/{ticket}', [TicketController::class, 'show'])->whereNumber('ticket');
        Route::patch('/tickets/{ticket}', [TicketController::class, 'update']);
        Route::post('/tickets/{ticket}/messages', [TicketController::class, 'reply']);
        Route::post('/tickets/{ticket}/suggest-reply', [TicketController::class, 'suggestReply']);
    });

    /*
    |--------------------------------------------------------------------------
    | Client externe
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('/projects', [ClientController::class, 'projects']);
        Route::get('/projects/{project}', [ClientController::class, 'project']);
        Route::post('/projects/{project}/change-requests', [ClientController::class, 'storeChangeRequest']);
        Route::get('/tickets', [ClientController::class, 'tickets']);
        Route::post('/tickets', [ClientController::class, 'storeTicket']);
        Route::get('/tickets/{ticket}', [ClientController::class, 'showTicket']);
        Route::post('/tickets/{ticket}/messages', [ClientController::class, 'replyTicket']);
        Route::post('/tickets/{ticket}/close', [ClientController::class, 'closeTicket']);
    });
});
