<?php
/**
 * Migration: Add missing columns to moi_entries table
 * Compatible with older MySQL versions that don't support IF NOT EXISTS
 */

require_once __DIR__ . '/../config/db.php';

$db = getDB();

function columnExists(mysqli $db, string $table, string $column): bool {
    $result = $db->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $result && $result->num_rows > 0;
}

$migrations = [
    ['table' => 'moi_entries', 'column' => 'company', 'sql' => "ALTER TABLE moi_entries ADD COLUMN company VARCHAR(100) NULL AFTER city"],
    ['table' => 'moi_entries', 'column' => 'occupation', 'sql' => "ALTER TABLE moi_entries ADD COLUMN occupation VARCHAR(100) NULL AFTER company"],
];

foreach ($migrations as $m) {
    if (columnExists($db, $m['table'], $m['column'])) {
        echo "SKIP: {$m['column']} already exists in {$m['table']}\n";
    } else {
        try {
            $db->query($m['sql']);
            echo "OK: Added {$m['column']} to {$m['table']}\n";
        } catch (Exception $e) {
            echo "ERROR: {$m['sql']} — " . $e->getMessage() . "\n";
        }
    }
}

echo "Migration complete.\n";
