<?php

use App\Models\ActiveSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

test('user has role method works correctly', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $user = User::factory()->create(['role' => User::ROLE_USER]);

    expect($admin->hasRole(User::ROLE_ADMIN))->toBeTrue();
    expect($user->hasRole(User::ROLE_USER))->toBeTrue();
    expect($admin->hasRole(User::ROLE_USER))->toBeFalse();
    expect($user->hasRole(User::ROLE_ADMIN))->toBeFalse();
});

test('user role helper methods work correctly', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $user = User::factory()->create(['role' => User::ROLE_USER]);

    expect($admin->hasRole(User::ROLE_ADMIN))->toBeTrue();
    expect($user->isUser())->toBeTrue();
});

test('user get dashboard route returns correct path', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $user = User::factory()->create(['role' => User::ROLE_USER]);

    expect($admin->getDashboardRoute())->toBe('/dashboard');
    expect($user->getDashboardRoute())->toBe('/dashboard');
});

test('avatar is deleted when user is deleted', function () {
    $avatarPath = 'avatars/test.jpg';
    Storage::disk('public')->put($avatarPath, 'fake content');

    $user = User::factory()->create(['avatar' => $avatarPath]);

    $user->delete();

    Storage::disk('public')->assertMissing($avatarPath);
});

test('old avatar is deleted when new avatar is uploaded', function () {
    $oldAvatarPath = 'avatars/old.jpg';
    $newAvatarPath = 'avatars/new.jpg';

    Storage::disk('public')->put($oldAvatarPath, 'old content');
    Storage::disk('public')->put($newAvatarPath, 'new content');

    $user = User::factory()->create(['avatar' => $oldAvatarPath]);

    $user->update(['avatar' => $newAvatarPath]);

    Storage::disk('public')->assertMissing($oldAvatarPath);
    Storage::disk('public')->assertExists($newAvatarPath);
});

test('user has active sessions relationship', function () {
    $user = User::factory()->create();

    ActiveSession::create([
        'user_id' => $user->id,
        'token_id' => 'test-token',
        'device_name' => 'Test Device',
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Test Agent',
        'last_activity' => now(),
    ]);

    expect($user->activeSessions)->toHaveCount(1);
    expect($user->activeSessions->first()->device_name)->toBe('Test Device');
});

test('password is automatically hashed when set', function () {
    $user = User::factory()->create([
        'password' => 'plainpassword',
    ]);

    expect($user->password)->not->toBe('plainpassword');
    expect(\Illuminate\Support\Facades\Hash::check('plainpassword', $user->password))->toBeTrue();
});

test('user email and username are unique', function () {
    User::factory()->create([
        'email' => 'test@example.com',
        'username' => 'testuser',
    ]);

    expect(function () {
        User::factory()->create(['email' => 'test@example.com']);
    })->toThrow(\Illuminate\Database\QueryException::class);

    expect(function () {
        User::factory()->create(['username' => 'testuser']);
    })->toThrow(\Illuminate\Database\QueryException::class);
});

