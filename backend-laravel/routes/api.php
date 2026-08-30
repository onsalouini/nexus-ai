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
    Route::apiResource('/projects', ProjectController::class)->only(['index', 'store', 'show']);
    Route::get( '/director/dashboard', [DirectorDashboardController::class, 'index']
    );
    Route::get(
        '/director/projects',
        [DirectorProjectController::class, 'index']
    );

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

});
