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
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['file', 'link'])->default('file');
            $table->string('name'); // Nama file atau title link
            $table->string('path')->nullable(); // Path file di storage (untuk type file)
            $table->string('url')->nullable(); // URL link atau file URL (untuk type link atau file)
            $table->string('mime_type')->nullable(); // MIME type untuk file (e.g., 'image/png', 'application/pdf')
            $table->unsignedBigInteger('size')->nullable(); // Ukuran file dalam bytes
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes for performance
            $table->index('task_id');
            $table->index('type');
            $table->index('created_by');
            $table->index(['task_id', 'type']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_attachments');
    }
};
