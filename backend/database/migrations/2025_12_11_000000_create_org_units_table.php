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
        Schema::create('org_units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->nullable();
            $table->string('code')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('org_units')->onDelete('set null');
            $table->index(['parent_id', 'order']);
            $table->index(['is_active']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('org_unit_id')->nullable()->after('employee_id');
            $table->string('title')->nullable()->after('org_unit_id');

            $table->foreign('org_unit_id')->references('id')->on('org_units')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['org_unit_id']);
            $table->dropColumn(['org_unit_id', 'title']);
        });

        Schema::dropIfExists('org_units');
    }
};

