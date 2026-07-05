<?php
/**
 * Migration: auth_sessions table + logout status in login_logs
 * Run once: php backend/scripts/migrate_auth_sessions.php
 */

require_once __DIR__ . '/../config/bootstrap.php';

$db = getDB();

echo "Migrating auth_sessions + login_logs logout status...\n";

$sql = "CREATE TABLE IF NOT EXISTS auth_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    jti VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_jti (jti),
    KEY idx_user_id (user_id),
    KEY idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($db->query($sql)) {
    echo "✓ auth_sessions table ready\n";
} else {
    echo "✗ auth_sessions: " . $db->error . "\n";
    exit(1);
}

if ($db->query("SHOW TABLES LIKE 'login_logs'")->num_rows > 0) {
    $col = $db->query("SHOW COLUMNS FROM login_logs LIKE 'status'")->fetch_assoc();
    if ($col && strpos($col['Type'], 'logout') === false) {
        if ($db->query("ALTER TABLE login_logs MODIFY status ENUM('success', 'failed', 'blocked', 'logout') NOT NULL")) {
            echo "✓ login_logs.status now includes 'logout'\n";
        } else {
            echo "✗ login_logs status alter: " . $db->error . "\n";
            exit(1);
        }
    } else {
        echo "✓ login_logs.status already includes logout\n";
    }
} else {
    echo "- login_logs table not found (skip status alter)\n";
}

echo "\nMigration complete.\n";
