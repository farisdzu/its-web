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
        Schema::create('org_unit_parents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('org_unit_id'); // Child unit
            $table->unsignedBigInteger('parent_id'); // Parent unit
            $table->timestamps();

            // Foreign keys
            $table->foreign('org_unit_id')->references('id')->on('org_units')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('org_units')->onDelete('cascade');
            
            // Prevent duplicate parent-child relationships
            $table->unique(['org_unit_id', 'parent_id']);
            
            // Optimized indexes for common queries
            $table->index('org_unit_id'); // For finding all parents of a unit
            $table->index('parent_id');   // For finding all children of a parent
            
            // Note: Self-reference prevention is handled in application level (controller validation)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('org_unit_parents');
    }
};
