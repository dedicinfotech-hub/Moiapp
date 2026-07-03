<?php
/**
 * Migration: Add missing columns to login_logs table
 * Run this once to fix: "Unknown column 'email'/'role' in 'field list'"
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db.php';

$db = getDB();

echo "Migrating login_logs table...\n";

// Check if table exists
$tableExists = $db->query("SHOW TABLES LIKE 'login_logs'")->num_rows > 0;

if (!$tableExists) {
    echo "Table does not exist. Creating login_logs table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        email VARCHAR(150) NULL,
        role VARCHAR(20) NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        status ENUM('success', 'failed', 'blocked') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )";
    
    if ($db->query($sql)) {
        echo "✓ Table created successfully!\n";
    } else {
        echo "✗ Failed to create table: " . $db->error . "\n";
        exit(1);
    }
} else {
    // Check current columns
    $result = $db->query("DESCRIBE login_logs");
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row['Field'];
    }

    echo "Current columns: " . implode(', ', $columns) . "\n";

    // Add missing columns one by one
    $additions = [
        'email' => "ADD COLUMN email VARCHAR(150) NULL AFTER user_id",
        'role' => "ADD COLUMN role VARCHAR(20) NULL AFTER email",
        'ip_address' => "ADD COLUMN ip_address VARCHAR(45) NULL AFTER role",
        'user_agent' => "ADD COLUMN user_agent TEXT NULL AFTER ip_address",
        'status' => "ADD COLUMN status ENUM('success', 'failed', 'blocked') NOT NULL AFTER user_agent",
        'created_at' => "ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status",
    ];

    foreach ($additions as $col => $sql) {
        if (!in_array($col, $columns)) {
            echo "Adding column: $col\n";
            if ($db->query("ALTER TABLE login_logs $sql")) {
                echo "  ✓ Added $col\n";
            } else {
                echo "  ✗ Failed to add $col: " . $db->error . "\n";
            }
        } else {
            echo "  - Column $col already exists\n";
        }
    }
}

// Final verification
echo "\nFinal verification:\n";
$result = $db->query("DESCRIBE login_logs");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}
echo "Columns: " . implode(', ', $columns) . "\n";

$required = ['id', 'user_id', 'email', 'role', 'ip_address', 'user_agent', 'status', 'created_at'];
$missing = array_diff($required, $columns);

if (empty($missing)) {
    echo "\n✓ All required columns present. Migration complete!\n";
} else {
    echo "\n✗ Still missing columns: " . implode(', ', $missing) . "\n";
    exit(1);
}
