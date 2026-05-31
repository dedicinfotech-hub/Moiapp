<?php
require_once __DIR__ . '/../config/bootstrap.php';

// Disable bootstrap's JSON header reset if we're running in CLI
if (php_sapi_name() === 'cli') {
    ini_set('display_errors', '1');
}

echo "🚀 Starting database migration...\n";

$db = new mysqli("127.0.0.1", "root", "root", "moiapp", 8889);
if ($db->connect_error) {
    $db = getDB();
}

// 1. Check existing columns in moi_entries
$result = $db->query("SHOW COLUMNS FROM moi_entries");
if (!$result) {
    die("❌ Error querying moi_entries table: " . $db->error . "\n");
}

$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}

echo "Current columns: " . implode(", ", $columns) . "\n";

// Add city column
if (!in_array('city', $columns)) {
    echo "Adding 'city' column...\n";
    if ($db->query("ALTER TABLE moi_entries ADD COLUMN city VARCHAR(150) NULL AFTER guest_name")) {
        echo "✅ 'city' column added successfully.\n";
    } else {
        echo "❌ Failed to add 'city' column: " . $db->error . "\n";
    }
} else {
    echo "ℹ️ 'city' column already exists.\n";
}

// Add gift_type column
if (!in_array('gift_type', $columns)) {
    echo "Adding 'gift_type' column...\n";
    if ($db->query("ALTER TABLE moi_entries ADD COLUMN gift_type ENUM('cash', 'gold', 'gift') NOT NULL DEFAULT 'cash' AFTER amount")) {
        echo "✅ 'gift_type' column added successfully.\n";
    } else {
        echo "❌ Failed to add 'gift_type' column: " . $db->error . "\n";
    }
} else {
    echo "ℹ️ 'gift_type' column already exists.\n";
}

// Add gold_weight column
if (!in_array('gold_weight', $columns)) {
    echo "Adding 'gold_weight' column...\n";
    if ($db->query("ALTER TABLE moi_entries ADD COLUMN gold_weight DECIMAL(10,2) NULL AFTER gift_type")) {
        echo "✅ 'gold_weight' column added successfully.\n";
    } else {
        echo "❌ Failed to add 'gold_weight' column: " . $db->error . "\n";
    }
} else {
    echo "ℹ️ 'gold_weight' column already exists.\n";
}

// Add gift_description column
if (!in_array('gift_description', $columns)) {
    echo "Adding 'gift_description' column...\n";
    if ($db->query("ALTER TABLE moi_entries ADD COLUMN gift_description VARCHAR(255) NULL AFTER gold_weight")) {
        echo "✅ 'gift_description' column added successfully.\n";
    } else {
        echo "❌ Failed to add 'gift_description' column: " . $db->error . "\n";
    }
} else {
    echo "ℹ️ 'gift_description' column already exists.\n";
}

// Modify amount column to default to 0.00
echo "Modifying 'amount' column to have default 0.00...\n";
if ($db->query("ALTER TABLE moi_entries MODIFY COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00")) {
    echo "✅ 'amount' column modified successfully.\n";
} else {
    echo "❌ Failed to modify 'amount' column: " . $db->error . "\n";
}

// 2. Check existing columns in users
$userResult = $db->query("SHOW COLUMNS FROM users");
if (!$userResult) {
    die("❌ Error querying users table: " . $db->error . "\n");
}

$userColumns = [];
while ($row = $userResult->fetch_assoc()) {
    $userColumns[] = $row['Field'];
}

// Add upi_id column
if (!in_array('upi_id', $userColumns)) {
    echo "Adding 'upi_id' column to users...\n";
    $db->query("ALTER TABLE users ADD COLUMN upi_id VARCHAR(100) NULL AFTER phone");
}
// Add bank_name column
if (!in_array('bank_name', $userColumns)) {
    echo "Adding 'bank_name' column to users...\n";
    $db->query("ALTER TABLE users ADD COLUMN bank_name VARCHAR(100) NULL AFTER upi_id");
}
// Add account_number column
if (!in_array('account_number', $userColumns)) {
    echo "Adding 'account_number' column to users...\n";
    $db->query("ALTER TABLE users ADD COLUMN account_number VARCHAR(50) NULL AFTER bank_name");
}
// Add ifsc_code column
if (!in_array('ifsc_code', $userColumns)) {
    echo "Adding 'ifsc_code' column to users...\n";
    $db->query("ALTER TABLE users ADD COLUMN ifsc_code VARCHAR(20) NULL AFTER account_number");
}
// Add account_holder column
if (!in_array('account_holder', $userColumns)) {
    echo "Adding 'account_holder' column to users...\n";
    $db->query("ALTER TABLE users ADD COLUMN account_holder VARCHAR(100) NULL AFTER ifsc_code");
}

echo "✅ Database migration completed successfully!\n";
