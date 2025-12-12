<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Update existing data - convert dekan, unit, sdm to user
        DB::table('users')
            ->whereIn('role', ['dekan', 'unit', 'sdm'])
            ->update(['role' => 'user']);

        // Step 2: Modify the enum column
        // Note: MySQL doesn't support direct enum modification, so we need to use raw SQL
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Restore enum to original values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'dekan', 'unit', 'sdm') NOT NULL DEFAULT 'sdm'");

        // Step 2: Note: We can't automatically restore the original roles
        // This would need manual intervention or a backup
        // For now, we'll leave all as 'sdm' (default)
        DB::table('users')
            ->where('role', 'user')
            ->where('role', '!=', 'admin')
            ->update(['role' => 'sdm']);
    }
};
