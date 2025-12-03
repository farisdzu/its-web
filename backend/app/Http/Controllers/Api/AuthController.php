<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RequestPasswordResetRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\UploadAvatarRequest;
use App\Http\Requests\Auth\VerifyPasswordResetOTPRequest;
use App\Mail\PasswordResetOTP as PasswordResetOTPMail;
use App\Models\ActiveSession;
use App\Models\PasswordResetOTP;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 300;
    private const TOKEN_EXPIRATION_MINUTES = 1440;

    public function login(LoginRequest $request): JsonResponse
    {
        $this->checkRateLimiting($request);

        $login = $request->email;

        // Optimize: Use cache for user lookup and fix query grouping
        $cacheKey = "user_login_{$login}";
        $user = Cache::remember($cacheKey, 300, function () use ($login) {
            return User::with('activeSessions')
                ->where(function ($query) use ($login) {
                    $query->where('email', $login)
                          ->orWhere('username', $login);
                })
                ->first();
        });

        if (! $user || ! Hash::check($request->password, $user->password)) {
            $this->incrementRateLimiting($request);
            // Clear cache on failed login attempt
            Cache::forget($cacheKey);

            return response()->json([
                'success' => false,
                'message' => 'Email/username atau password salah.',
            ], 401);
        }
        
        // Clear cache on successful login
        Cache::forget($cacheKey);

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
            ], 403);
        }

        if (! $request->boolean('force_logout')) {
            $existingSession = $user->activeSessions()->first();

            if ($existingSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun ini sedang digunakan di perangkat lain.',
                    'requires_force_logout' => true,
                    'existing_session' => [
                        'device_name' => $existingSession->device_name,
                        'browser_name' => $this->getBrowserName($existingSession->user_agent),
                        'ip_address' => $this->maskIpAddress($existingSession->ip_address),
                        'last_activity' => $existingSession->last_activity?->diffForHumans(),
                    ],
                ], 409);
            }
        }

        $existingSession = $user->activeSessions()->first();
        if ($existingSession && $request->boolean('force_logout')) {
            $this->terminateAllUserSessions($user);
        }

        $this->clearRateLimiting($request);

        $deviceName = $request->device_name ?? $this->getDeviceName($request);
        
        try {
            $token = $user->createToken(
                $deviceName,
                ['*'],
                now()->addMinutes(self::TOKEN_EXPIRATION_MINUTES)
            );

            $tokenId = $token->accessToken->getKey();

            ActiveSession::create([
                'user_id' => $user->id,
                'token_id' => (string) $tokenId,
                'device_name' => $deviceName,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit($request->userAgent() ?? '', 500),
                'last_activity' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat membuat sesi. Silakan coba lagi.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar ? Storage::url($user->avatar) : null,
                    'role' => $user->role,
                    'employee_id' => $user->employee_id,
                ],
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_in' => self::TOKEN_EXPIRATION_MINUTES * 60,
                'redirect_to' => $user->getDashboardRoute(),
            ],
        ], 200);
    }

    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        if (! $currentToken) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid.',
            ], 401);
        }

        $tokenId = $currentToken->getKey();
        $currentSession = ActiveSession::where('token_id', (string) $tokenId)->first();
        $deviceName = $currentSession?->device_name ?? $this->getDeviceName($request);

        $newToken = $user->createToken(
            $deviceName,
            ['*'],
            now()->addMinutes(self::TOKEN_EXPIRATION_MINUTES)
        );

        if ($currentSession) {
            $newTokenId = $newToken->accessToken->getKey();
            $currentSession->update([
                'token_id' => (string) $newTokenId,
                'last_activity' => now(),
            ]);
        }

        $currentToken->delete();

        return response()->json([
            'success' => true,
            'message' => 'Token berhasil diperbarui.',
            'data' => [
                'token' => $newToken->plainTextToken,
                'token_type' => 'Bearer',
                'expires_in' => self::TOKEN_EXPIRATION_MINUTES * 60,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->updateSessionActivity($request);

        $userData = Cache::remember(
            "user_{$user->id}",
            300,
            fn () => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar ? Storage::url($user->avatar) : null,
                'role' => $user->role,
                'employee_id' => $user->employee_id,
                'redirect_to' => $user->getDashboardRoute(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $userData,
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone ?: null,
            ];

            if ($request->has('username')) {
                $updateData['username'] = $request->username ?: null;
            }

            $user->update($updateData);

            Cache::forget("user_{$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Profil berhasil diperbarui.',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar ? Storage::url($user->avatar) : null,
                    'role' => $user->role,
                    'employee_id' => $user->employee_id,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Update profile error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui profil. Silakan coba lagi.',
            ], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password saat ini tidak benar.',
            ], 422);
        }

        if (Hash::check($request->new_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password baru harus berbeda dengan password saat ini.',
            ], 422);
        }

        try {
            $user->update([
                'password' => Hash::make($request->new_password),
            ]);

            Cache::forget("user_{$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Change password error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengubah password. Silakan coba lagi.',
            ], 500);
        }
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $avatarPath = $request->file('avatar')->store('avatars', 'public');

            $user->update(['avatar' => $avatarPath]);

            Cache::forget("user_{$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Avatar berhasil diupload.',
                'data' => [
                    'avatar' => Storage::url($avatarPath),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Upload avatar error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengupload avatar. Silakan coba lagi.',
            ], 500);
        }
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $user->update(['avatar' => null]);

            Cache::forget("user_{$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Avatar berhasil dihapus.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Delete avatar error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus avatar. Silakan coba lagi.',
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $currentToken = $user->currentAccessToken();

        if ($currentToken) {
            $tokenId = $currentToken->getKey();
            ActiveSession::where('token_id', (string) $tokenId)->delete();
            $currentToken->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function checkSession(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Optimize: Use cache for user lookup
        $cacheKey = "user_check_session_{$request->email}";
        $user = Cache::remember($cacheKey, 60, function () use ($request) {
            return User::where('email', $request->email)->first();
        });

        if (! $user) {
            return response()->json([
                'success' => true,
                'has_active_session' => false,
            ]);
        }

        // Optimize: Eager load active sessions
        $existingSession = $user->activeSessions()->first();

        return response()->json([
            'success' => true,
            'has_active_session' => (bool) $existingSession,
            'session_info' => $existingSession ? [
                'device_name' => $existingSession->device_name,
                'browser_name' => $this->getBrowserName($existingSession->user_agent),
                'ip_address' => $this->maskIpAddress($existingSession->ip_address),
                'last_activity' => $existingSession->last_activity?->diffForHumans(),
            ] : null,
        ]);
    }

    private function terminateAllUserSessions(User $user): void
    {
        $user->activeSessions()->delete();
        $user->tokens()->delete();
    }

    private function updateSessionActivity(Request $request): void
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        if ($currentToken) {
            $tokenId = $currentToken->getKey();
            ActiveSession::where('token_id', (string) $tokenId)
                ->update(['last_activity' => now()]);
        }
    }

    private function getDeviceName(Request $request): string
    {
        $userAgent = $request->userAgent() ?? 'Unknown';

        if (str_contains($userAgent, 'Mobile') || str_contains($userAgent, 'Android') || str_contains($userAgent, 'iPhone')) {
            return 'Mobile';
        }

        if (str_contains($userAgent, 'Windows')) {
            return 'Windows';
        }

        if (str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS')) {
            return 'macOS';
        }

        if (str_contains($userAgent, 'Linux')) {
            return 'Linux';
        }

        return 'Unknown Device';
    }

    private function getBrowserName(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'Unknown Browser';
        }

        $userAgent = strtolower($userAgent);

        if (str_contains($userAgent, 'chrome') && !str_contains($userAgent, 'edg') && !str_contains($userAgent, 'opr')) {
            return 'Google Chrome';
        }

        if (str_contains($userAgent, 'edg')) {
            return 'Microsoft Edge';
        }

        if (str_contains($userAgent, 'firefox')) {
            return 'Mozilla Firefox';
        }

        if (str_contains($userAgent, 'safari') && !str_contains($userAgent, 'chrome')) {
            return 'Safari';
        }

        if (str_contains($userAgent, 'opr') || str_contains($userAgent, 'opera')) {
            return 'Opera';
        }

        if (str_contains($userAgent, 'brave')) {
            return 'Brave';
        }

        return 'Unknown Browser';
    }

    private function maskIpAddress(?string $ip): string
    {
        if (! $ip) {
            return 'Unknown';
        }

        $parts = explode('.', $ip);
        if (count($parts) === 4) {
            return $parts[0].'.'.$parts[1].'.xxx.xxx';
        }

        return Str::limit($ip, 10, '...');
    }

    private function checkRateLimiting(LoginRequest $request): void
    {
        $key = $this->getRateLimitKey($request);

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'email' => [
                    "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik.",
                ],
            ]);
        }
    }

    private function incrementRateLimiting(LoginRequest $request): void
    {
        RateLimiter::hit($this->getRateLimitKey($request), self::DECAY_SECONDS);
    }

    private function clearRateLimiting(LoginRequest $request): void
    {
        RateLimiter::clear($this->getRateLimitKey($request));
    }

    private function getRateLimitKey(LoginRequest $request): string
    {
        return Str::lower($request->email).'|'.$request->ip();
    }

    public function requestPasswordResetOTP(RequestPasswordResetRequest $request): JsonResponse
    {
        $email = $request->email;

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak terdaftar dalam sistem.',
            ], 404);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
            ], 403);
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PasswordResetOTP::where('email', $email)->delete();

        PasswordResetOTP::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
            'is_verified' => false,
        ]);

        try {
            Mail::to($email)->send(new PasswordResetOTPMail($otp, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset OTP email: ' . $e->getMessage(), [
                'email' => $email,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email OTP. Silakan coba lagi.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP telah dikirim ke email Anda. Silakan cek inbox Anda.',
        ]);
    }

    public function verifyPasswordResetOTP(VerifyPasswordResetOTPRequest $request): JsonResponse
    {
        $email = $request->email;
        $otp = $request->otp;

        $otpRecord = PasswordResetOTP::validForEmail($email)
            ->where('otp', $otp)
            ->first();

        if (! $otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid atau telah kedaluwarsa.',
            ], 422);
        }

        $otpRecord->markAsVerified();

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP berhasil diverifikasi. Silakan masukkan password baru.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = $request->email;
        $otp = $request->otp;
        $password = $request->password;

        $otpRecord = PasswordResetOTP::where('email', $email)
            ->where('otp', $otp)
            ->where('is_verified', true)
            ->first();

        if (! $otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid atau belum diverifikasi.',
            ], 422);
        }

        if ($otpRecord->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP telah kedaluwarsa. Silakan request OTP baru.',
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        try {
            $user->update([
                'password' => Hash::make($password),
            ]);

            Cache::forget("user_{$user->id}");

            PasswordResetOTP::where('email', $email)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login dengan password baru.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to reset password: ' . $e->getMessage(), [
                'email' => $email,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mereset password. Silakan coba lagi.',
            ], 500);
        }
    }
}
