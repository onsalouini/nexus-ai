<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InvitationController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/me', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/invitations/validate/{token}', [InvitationController::class, 'validateToken']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/onboarding/company', [AuthController::class, 'setupCompany']);
    Route::post('/company', [AuthController::class, 'setupCompany']);
    Route::post('/invitations', [InvitationController::class, 'store']);
    Route::get('/invitations', [InvitationController::class, 'index']);
});
