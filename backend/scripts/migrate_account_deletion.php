<?php
/**
 * Migration: Add deleted_at column to users table for account deletion with grace period
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$db = getDB();

// Check if column already exists
$result = $db->query("SHOW COLUMNS FROM users LIKE 'deleted_at'");
if ($result->num_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Column deleted_at already exists']);
    exit;
}

// Add deleted_at column
$sql = "ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL AFTER created_at";
if ($db->query($sql)) {
    echo json_encode(['success' => true, 'message' => 'Added deleted_at column to users table']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to add column: ' . $db->error]);
}
