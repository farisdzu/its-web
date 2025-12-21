<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Add type field after id
            $table->enum('type', ['tugas', 'agenda'])->default('tugas')->after('id');
            
            // Add agenda-specific fields after due_date
            $table->time('start_time')->nullable()->after('due_date');
            $table->time('end_time')->nullable()->after('start_time');
            $table->string('meeting_link', 500)->nullable()->after('end_time');
            
            // Add index for type
            $table->index('type');
            $table->index(['type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['type', 'status']);
            $table->dropIndex(['type']);
            
            // Drop columns
            $table->dropColumn(['meeting_link', 'end_time', 'start_time', 'type']);
        });
    }
};
