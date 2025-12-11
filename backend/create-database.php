#!/usr/bin/env php
<?php

/**
 * Script untuk membuat database MySQL
 * Usage: php create-database.php
 */

require __DIR__ . '/vendor/autoload.php';

// Load .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$database = $_ENV['DB_DATABASE'] ?? 'its-fkk-local';
$username = $_ENV['DB_USERNAME'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';

echo "🔧 Membuat database: {$database}\n";
echo "📡 Host: {$host}:{$port}\n";
echo "👤 User: {$username}\n\n";

try {
    // Connect to MySQL server (without database)
    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // Create database
    $sql = "CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $pdo->exec($sql);

    echo "✅ Database '{$database}' berhasil dibuat!\n";
    echo "💡 Sekarang Anda bisa menjalankan: php artisan migrate\n";

    exit(0);
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\n💡 Tips:\n";
    echo "   1. Pastikan MySQL server sudah running\n";
    echo "   2. Pastikan username dan password di .env benar\n";
    echo "   3. Atau buat database manual dengan:\n";
    echo "      mysql -u {$username} -p -e \"CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"\n";
    exit(1);
}

