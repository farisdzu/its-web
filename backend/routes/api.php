<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrgUnitController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1') // 10 requests per minute
        ->name('auth.login');
    Route::post('/check-session', [AuthController::class, 'checkSession'])
        ->middleware('throttle:20,1')
        ->name('auth.check-session');
    
    // Password reset routes
    Route::post('/password/reset/request', [AuthController::class, 'requestPasswordResetOTP'])
        ->middleware('throttle:5,1') // 5 requests per minute
        ->name('auth.password.reset.request');
    Route::post('/password/reset/verify', [AuthController::class, 'verifyPasswordResetOTP'])
        ->middleware('throttle:10,1')
        ->name('auth.password.reset.verify');
    Route::post('/password/reset', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:5,1')
        ->name('auth.password.reset');
});

// Global rate limiting untuk semua API routes (120 requests per minute per user/IP)
// Ini mencegah abuse dan overload server saat banyak user mengakses bersamaan
Route::middleware('throttle:120,1')->group(function () {
    // Protected routes (requires authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth routes - accessible to all authenticated users
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
            Route::post('/refresh', [AuthController::class, 'refreshToken'])->name('auth.refresh');
            Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
            Route::put('/profile', [AuthController::class, 'updateProfile'])->name('auth.update-profile');
            Route::put('/change-password', [AuthController::class, 'changePassword'])->name('auth.change-password');
            Route::post('/avatar', [AuthController::class, 'uploadAvatar'])->name('auth.upload-avatar');
            Route::delete('/avatar', [AuthController::class, 'deleteAvatar'])->name('auth.delete-avatar');
        });

        Route::middleware('role:admin')->prefix('org-units')->group(function () {
            Route::get('/', [OrgUnitController::class, 'index'])->name('org-units.index');
            Route::post('/', [OrgUnitController::class, 'store'])->name('org-units.store');
            Route::patch('/{orgUnit}', [OrgUnitController::class, 'update'])->name('org-units.update');
            Route::delete('/{orgUnit}', [OrgUnitController::class, 'destroy'])->name('org-units.destroy');
        });

        // Example: Role-protected routes
        // Route::middleware('role:admin')->group(function () {
        //     Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
        // });
        //
        // Route::middleware('role:admin,dekan')->group(function () {
        //     Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        // });
    });
});

