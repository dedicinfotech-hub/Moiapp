<?php
/**
 * MoiApp Database Migration Script
 * 
 * For NEW databases: Creates all tables with latest schema
 * For EXISTING databases: Adds missing columns/tables without dropping data
 * 
 * Usage:
 *   php scripts/migrate.php              # Local MAMP
 *   php scripts/migrate.php --hostinger  # Hostinger (uses schema_hostinger.sql)
 */

$isHostinger = in_array('--hostinger', $argv);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db.php';

$db = getDB();

echo "========================================\n";
echo "MoiApp Database Migration\n";
echo "========================================\n\n";

if ($isHostinger) {
    echo "Mode: Hostinger (import schema_hostinger.sql)\n";
    $sqlFile = __DIR__ . '/../schema_hostinger.sql';
} else {
    echo "Mode: Local / New database (import schema.sql)\n";
    $sqlFile = __DIR__ . '/../schema.sql';
}

// Read and execute SQL file
$sql = file_get_contents($sqlFile);
if ($sql === false) {
    echo "✗ Could not read schema file: $sqlFile\n";
    exit(1);
}

// Split by semicolons and execute each statement
$statements = array_filter(
    array_map('trim', explode(';', $sql)),
    function ($stmt) { return !empty($stmt); }
);

$success = 0;
$failed = 0;

foreach ($statements as $stmt) {
    // Skip empty lines and comments
    $stmt = preg_replace('/--.*$/m', '', $stmt);
    $stmt = trim($stmt);
    if (empty($stmt)) continue;

    if ($db->query($stmt)) {
        $success++;
    } else {
        // Ignore "table already exists" errors for CREATE TABLE IF NOT EXISTS
        if (strpos($db->error, 'already exists') !== false) {
            $success++;
        } else {
            echo "✗ Failed: " . substr($stmt, 0, 80) . "...\n";
            echo "  Error: " . $db->error . "\n";
            $failed++;
        }
    }
}

echo "\n----------------------------------------\n";
echo "Results: $success succeeded, $failed failed\n";

if ($failed === 0) {
    echo "✓ Migration completed successfully!\n";
} else {
    echo "✗ Migration completed with errors\n";
    exit(1);
}

// Verify critical tables
echo "\n----------------------------------------\n";
echo "Verifying critical tables...\n";

$requiredTables = [
    'users',
    'events',
    'moi_entries',
    'login_logs',
    'photos',
    'event_organizers',
    'invitations',
    'notifications',
    'return_gifts',
    'feature_toggles',
    'support_tickets',
    'password_resets',
];

foreach ($requiredTables as $table) {
    $result = $db->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows > 0) {
        echo "  ✓ $table\n";
    } else {
        echo "  ✗ $table MISSING\n";
    }
}

// Verify critical columns in login_logs
echo "\nVerifying login_logs columns...\n";
$result = $db->query("DESCRIBE login_logs");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}

$requiredColumns = ['id', 'user_id', 'email', 'role', 'ip_address', 'user_agent', 'status', 'created_at'];
foreach ($requiredColumns as $col) {
    if (in_array($col, $columns)) {
        echo "  ✓ $col\n";
    } else {
        echo "  ✗ $col MISSING\n";
    }
}

echo "\n========================================\n";
echo "Migration complete!\n";
echo "========================================\n";
