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
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/me', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::post('/auth/send-code', [AuthController::class, 'sendVerificationCode']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/verify-code', [AuthController::class, 'verifyCode']);
Route::get('/invitations/validate/{token}', [InvitationController::class, 'validateToken']);
use App\Http\Controllers\DirectorDashboardController;
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/onboarding/company', [AuthController::class, 'setupCompany']);
    Route::post('/company', [AuthController::class, 'setupCompany']);
    Route::post('/invitations', [InvitationController::class, 'store']);
    Route::get('/invitations', [InvitationController::class, 'index']);
    Route::apiResource('/projects', ProjectController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::get( '/director/dashboard', [DirectorDashboardController::class, 'index']
    );
    Route::get(
        '/director/projects',
        [DirectorProjectController::class, 'index']
    );
    Route::get('/projects/risk-predictions', [ProjectController::class, 'riskPredictions']);

    Route::get(
        '/director/projects/{project}',
        [DirectorProjectController::class, 'show']
    );
     Route::get(
        '/director/team',
        [DirectorTeamController::class, 'index']
    );

    Route::get(
        '/director/team/{member}',
        [DirectorTeamController::class, 'show']
    );
    Route::post(
    '/projects/{project}/generate-report',
    [ProjectController::class, 'generateReport']
);
Route::post(
    '/financial-health/predict',
    [FinancialHealthController::class, 'predict']
);

Route::post(
    '/financial-health/explain',
    [FinancialHealthController::class, 'explain']
);
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

// Paramètres de compte (chef + direction)
Route::get('/account', [AccountController::class, 'show']);
Route::put('/account/profile', [AccountController::class, 'updateProfile']);
Route::post('/account/avatar', [AccountController::class, 'updateAvatar']);
Route::put('/account/password', [AccountController::class, 'updatePassword']);
Route::put('/account/company', [AccountController::class, 'updateCompany']);
Route::post('/ai/chat', [AIChatController::class, 'chat']);
Route::get(
    '/ai/conversations',
    [AIConversationController::class, 'index']
);

Route::post(
    '/ai/conversations',
    [AIConversationController::class, 'store']
);

Route::get(
    '/ai/conversations/{conversation}',
    [AIConversationController::class, 'show']
);
Route::post(
    '/ai/conversations/{conversation}/messages',
    [AIConversationMessageController::class, 'store']
);
Route::post(
    '/ai/conversations/{conversation}/attachments',
    [AIAttachmentController::class, 'store']
);
Route::post(
    '/financial-health/store',
    [FinancialHealthController::class, 'store']
);

Route::get(
    '/financial-health/history',
    [FinancialHealthController::class, 'history']
);

Route::get(
    '/financial-health/reports/{report}',
    [FinancialHealthController::class, 'show']
);
Route::get(
    '/financial-health/reports/{report}/download',
    [FinancialHealthController::class, 'download']
);
Route::post('/risk-predictions/test', [ProjectController::class, 'testPrediction']);
Route::get('/ai/model-status', [ProjectController::class, 'modelStatus']);
});
