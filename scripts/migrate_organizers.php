<?php
/**
 * MoiApp — Organizers & Bulk Import Migration
 * Creates event_organizers table for multi-organizer support
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$db = getDB();
$errors = [];
$success = [];

// ── Create event_organizers table ──────────────────────────────────────────────
try {
    $db->query("
        CREATE TABLE IF NOT EXISTS event_organizers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('organizer', 'admin') NOT NULL DEFAULT 'organizer',
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_event_organizer (event_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $success[] = "Created event_organizers table";
} catch (Exception $e) {
    $errors[] = "event_organizers: " . $e->getMessage();
}

// ── Results ───────────────────────────────────────────────────────────────────
echo "\n=== MoiApp Organizers Migration Results ===\n\n";

if (!empty($success)) {
    echo "✅ SUCCESS:\n";
    foreach ($success as $s) {
        echo "   • $s\n";
    }
    echo "\n";
}

if (!empty($errors)) {
    echo "⚠️  NOTES:\n";
    foreach ($errors as $e) {
        echo "   • $e\n";
    }
    echo "\n";
}

echo "Migration complete!\n";
