<?php
/**
 * Migration: Add city and language columns to users (profile setup / settings)
 *
 * Usage:
 *   php scripts/migrate_user_profile_columns.php
 * Or run in Hostinger phpMyAdmin:
 *   ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL AFTER phone;
 *   ALTER TABLE users ADD COLUMN language VARCHAR(10) NULL DEFAULT 'en' AFTER city;
 */

require_once __DIR__ . '/../config/bootstrap.php';

$db = getDB();
$added = [];

$result = $db->query("SHOW COLUMNS FROM users LIKE 'city'");
if ($result->num_rows === 0) {
    if ($db->query('ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL AFTER phone')) {
        $added[] = 'city';
    } else {
        fwrite(STDERR, 'Failed to add city: ' . $db->error . PHP_EOL);
        exit(1);
    }
}

$result = $db->query("SHOW COLUMNS FROM users LIKE 'language'");
if ($result->num_rows === 0) {
    if ($db->query("ALTER TABLE users ADD COLUMN language VARCHAR(10) NULL DEFAULT 'en' AFTER city")) {
        $added[] = 'language';
    } else {
        fwrite(STDERR, 'Failed to add language: ' . $db->error . PHP_EOL);
        exit(1);
    }
}

if ($added === []) {
    echo "users.city and users.language already exist — nothing to do.\n";
} else {
    echo 'Added columns: ' . implode(', ', $added) . "\n";
}
