<?php
/**
 * MoiApp — Event Types & Role Migration
 * Adds event_type support (wedding/birthday/engagement/valakaappu/housewarming/custom) and role column
 * 
 * Run: php scripts/migrate_event_types.php
 */

require_once __DIR__ . '/../config/bootstrap.php';

$db = getDB();
$errors = [];
$success = [];

// Helper function to check if column exists
function columnExists($db, $table, $column) {
    $result = $db->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $result && $result->num_rows > 0;
}

// ── 1. Add role column to users ─────────────────────────────────────────────
if (!columnExists($db, 'users', 'role')) {
    try {
        $db->query("ALTER TABLE users ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'user'");
        $success[] = "Added role column to users table";
    } catch (Exception $e) {
        $errors[] = "role: " . $e->getMessage();
    }
} else {
    $success[] = "role column already exists in users table";
}

// ── 2. Add event_type column ──────────────────────────────────────────────────
if (!columnExists($db, 'events', 'event_type')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN event_type ENUM('wedding','birthday','engagement','valakaappu','housewarming','custom') NOT NULL DEFAULT 'wedding'");
        $success[] = "Added event_type column to events table";
    } catch (Exception $e) {
        $errors[] = "event_type: " . $e->getMessage();
    }
} else {
    $success[] = "event_type column already exists in events table";
}

// ── 3. Add custom_title column ────────────────────────────────────────────────
if (!columnExists($db, 'events', 'custom_title')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN custom_title VARCHAR(100) NULL");
        $success[] = "Added custom_title column to events table";
    } catch (Exception $e) {
        $errors[] = "custom_title: " . $e->getMessage();
    }
} else {
    $success[] = "custom_title column already exists in events table";
}

// ── 4. Add birthday_person_name column ────────────────────────────────────────
if (!columnExists($db, 'events', 'birthday_person_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN birthday_person_name VARCHAR(100) NULL");
        $success[] = "Added birthday_person_name column to events table";
    } catch (Exception $e) {
        $errors[] = "birthday_person_name: " . $e->getMessage();
    }
} else {
    $success[] = "birthday_person_name column already exists in events table";
}

// ── 5. Add birthday_person_age column ─────────────────────────────────────────
if (!columnExists($db, 'events', 'birthday_person_age')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN birthday_person_age INT NULL");
        $success[] = "Added birthday_person_age column to events table";
    } catch (Exception $e) {
        $errors[] = "birthday_person_age: " . $e->getMessage();
    }
} else {
    $success[] = "birthday_person_age column already exists in events table";
}

// ── 6. Add parent1_name column ────────────────────────────────────────────────
if (!columnExists($db, 'events', 'parent1_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN parent1_name VARCHAR(100) NULL");
        $success[] = "Added parent1_name column to events table";
    } catch (Exception $e) {
        $errors[] = "parent1_name: " . $e->getMessage();
    }
} else {
    $success[] = "parent1_name column already exists in events table";
}

// ── 7. Add parent2_name column ────────────────────────────────────────────────
if (!columnExists($db, 'events', 'parent2_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN parent2_name VARCHAR(100) NULL");
        $success[] = "Added parent2_name column to events table";
    } catch (Exception $e) {
        $errors[] = "parent2_name: " . $e->getMessage();
    }
} else {
    $success[] = "parent2_name column already exists in events table";
}

// ── 8. Add mother_name column ────────────────────────────────────────────────
if (!columnExists($db, 'events', 'mother_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN mother_name VARCHAR(100) NULL");
        $success[] = "Added mother_name column to events table";
    } catch (Exception $e) {
        $errors[] = "mother_name: " . $e->getMessage();
    }
} else {
    $success[] = "mother_name column already exists in events table";
}

// ── 9. Add father_name column ────────────────────────────────────────────────
if (!columnExists($db, 'events', 'father_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN father_name VARCHAR(100) NULL");
        $success[] = "Added father_name column to events table";
    } catch (Exception $e) {
        $errors[] = "father_name: " . $e->getMessage();
    }
} else {
    $success[] = "father_name column already exists in events table";
}

// ── 10. Add host_name column ────────────────────────────────────────────────
if (!columnExists($db, 'events', 'host_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN host_name VARCHAR(100) NULL");
        $success[] = "Added host_name column to events table";
    } catch (Exception $e) {
        $errors[] = "host_name: " . $e->getMessage();
    }
} else {
    $success[] = "host_name column already exists in events table";
}

// ── 11. Add spouse_name column ───────────────────────────────────────────────
if (!columnExists($db, 'events', 'spouse_name')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN spouse_name VARCHAR(100) NULL");
        $success[] = "Added spouse_name column to events table";
    } catch (Exception $e) {
        $errors[] = "spouse_name: " . $e->getMessage();
    }
} else {
    $success[] = "spouse_name column already exists in events table";
}

// ── 12. Add venue_latitude column ────────────────────────────────────────────
if (!columnExists($db, 'events', 'venue_latitude')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN venue_latitude DECIMAL(10, 8) NULL");
        $success[] = "Added venue_latitude column to events table";
    } catch (Exception $e) {
        $errors[] = "venue_latitude: " . $e->getMessage();
    }
} else {
    $success[] = "venue_latitude column already exists in events table";
}

// ── 7. Add venue_longitude column ───────────────────────────────────────────
if (!columnExists($db, 'events', 'venue_longitude')) {
    try {
        $db->query("ALTER TABLE events ADD COLUMN venue_longitude DECIMAL(11, 8) NULL");
        $success[] = "Added venue_longitude column to events table";
    } catch (Exception $e) {
        $errors[] = "venue_longitude: " . $e->getMessage();
    }
} else {
    $success[] = "venue_longitude column already exists in events table";
}

// ── 8. Add payment_status to moi_entries ──────────────────────────────────────
if (!columnExists($db, 'moi_entries', 'payment_status')) {
    try {
        $db->query("ALTER TABLE moi_entries ADD COLUMN payment_status ENUM('pending','confirmed','failed') NOT NULL DEFAULT 'pending'");
        $success[] = "Added payment_status column to moi_entries table";
    } catch (Exception $e) {
        $errors[] = "payment_status: " . $e->getMessage();
    }
} else {
    $success[] = "payment_status column already exists in moi_entries table";
}

// ── 9. Add upi_transaction_id to moi_entries ──────────────────────────────────
if (!columnExists($db, 'moi_entries', 'upi_transaction_id')) {
    try {
        $db->query("ALTER TABLE moi_entries ADD COLUMN upi_transaction_id VARCHAR(100) NULL");
        $success[] = "Added upi_transaction_id column to moi_entries table";
    } catch (Exception $e) {
        $errors[] = "upi_transaction_id: " . $e->getMessage();
    }
} else {
    $success[] = "upi_transaction_id column already exists in moi_entries table";
}

// ── 10. Add is_digitized to moi_entries ───────────────────────────────────────
if (!columnExists($db, 'moi_entries', 'is_digitized')) {
    try {
        $db->query("ALTER TABLE moi_entries ADD COLUMN is_digitized TINYINT(1) NOT NULL DEFAULT 0");
        $success[] = "Added is_digitized column to moi_entries table";
    } catch (Exception $e) {
        $errors[] = "is_digitized: " . $e->getMessage();
    }
} else {
    $success[] = "is_digitized column already exists in moi_entries table";
}

// ── 11. Add original_entry_date to moi_entries ────────────────────────────────
if (!columnExists($db, 'moi_entries', 'original_entry_date')) {
    try {
        $db->query("ALTER TABLE moi_entries ADD COLUMN original_entry_date DATE NULL");
        $success[] = "Added original_entry_date column to moi_entries table";
    } catch (Exception $e) {
        $errors[] = "original_entry_date: " . $e->getMessage();
    }
} else {
    $success[] = "original_entry_date column already exists in moi_entries table";
}

// ── Results ───────────────────────────────────────────────────────────────────
echo "\n=== MoiApp Migration Results ===\n\n";

if (!empty($success)) {
    echo "✅ SUCCESS:\n";
    foreach ($success as $s) {
        echo "   • $s\n";
    }
    echo "\n";
}

if (!empty($errors)) {
    echo "⚠️  ERRORS:\n";
    foreach ($errors as $e) {
        echo "   • $e\n";
    }
    echo "\n";
}

echo "Migration complete!\n";
