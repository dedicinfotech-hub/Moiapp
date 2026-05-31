<?php
require_once __DIR__ . '/../config/bootstrap.php';

echo "🧪 Starting Self-Contained API and Database Verification...\n";

$db = new mysqli("127.0.0.1", "root", "root", "moiapp", 8889);
if ($db->connect_error) {
    $db = getDB();
}

$tempUserId = null;
$tempEventId = null;
$insertedIds = [];

try {
    // 1. Get or create a dummy user
    $user_res = $db->query("SELECT id FROM users LIMIT 1");
    if ($user_res && $user_res->num_rows > 0) {
        $user = $user_res->fetch_assoc();
        $userId = intval($user['id']);
        echo "ℹ️ Using existing User ID: $userId\n";
    } else {
        echo "👤 Creating temporary dummy user...\n";
        $password = password_hash('password123', PASSWORD_DEFAULT);
        $db->query("INSERT INTO users (name, email, password, phone) VALUES ('Test User', 'test@example.com', '$password', '1234567890')");
        $userId = $db->insert_id;
        $tempUserId = $userId;
        echo "✅ Created temporary User ID: $userId\n";
    }

    // 2. Get or create a dummy event
    $event_res = $db->query("SELECT id, slug FROM events LIMIT 1");
    if ($event_res && $event_res->num_rows > 0) {
        $event = $event_res->fetch_assoc();
        $eventId = intval($event['id']);
        $eventSlug = $event['slug'];
        echo "💍 Using existing Event ID: $eventId (Slug: $eventSlug)\n";
    } else {
        echo "💍 Creating temporary dummy event...\n";
        $slug = 'test-wedding-' . time();
        $db->query("INSERT INTO events (user_id, slug, bride_name, groom_name, wedding_date, venue) VALUES ($userId, '$slug', 'Bride Name', 'Groom Name', '2026-06-15', 'Test Hall')");
        $eventId = $db->insert_id;
        $tempEventId = $eventId;
        echo "✅ Created temporary Event ID: $eventId (Slug: $slug)\n";
    }

    // 3. Define test entries
    $testEntries = [
        [
            'guest_name' => 'Test Cash Guest',
            'city' => 'Karaikudi',
            'gift_type' => 'cash',
            'amount' => 1500.00,
            'relation' => 'friend',
            'payment_mode' => 'upi',
            'note' => 'Vellaiyar Co.',
            'entered_by' => 'Verification Script'
        ],
        [
            'guest_name' => 'Test Gold Guest',
            'city' => 'Devakottai',
            'gift_type' => 'gold',
            'gold_weight' => 8.50,
            'relation' => 'family',
            'note' => '8g Sovereign chain',
            'entered_by' => 'Verification Script'
        ],
        [
            'guest_name' => 'Test Gift Guest',
            'city' => 'Madurai',
            'gift_type' => 'gift',
            'gift_description' => 'Silver Plate',
            'relation' => 'colleague',
            'note' => 'Silver vessel',
            'entered_by' => 'Verification Script'
        ]
    ];

    // 4. Insert entries using prepared statements
    foreach ($testEntries as $entry) {
        $city = isset($entry['city']) ? $entry['city'] : null;
        $giftType = $entry['gift_type'];
        $amount = isset($entry['amount']) ? floatval($entry['amount']) : 0;
        $goldWeight = isset($entry['gold_weight']) ? floatval($entry['gold_weight']) : null;
        $giftDescription = isset($entry['gift_description']) ? $entry['gift_description'] : null;
        $relation = $entry['relation'];
        $paymentMode = isset($entry['payment_mode']) ? $entry['payment_mode'] : 'cash';
        $note = $entry['note'];
        $enteredBy = $entry['entered_by'];
        
        echo "Inserting " . $entry['guest_name'] . " (" . $giftType . ")... ";
        
        $stmt = $db->prepare('INSERT INTO moi_entries (event_id, guest_name, city, amount, gift_type, gold_weight, gift_description, relation, payment_mode, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        if (!$stmt) {
            throw new Exception("Preparation failed: " . $db->error);
        }
        
        $stmt->bind_param('issdsdsssss', $eventId, $entry['guest_name'], $city, $amount, $giftType, $goldWeight, $giftDescription, $relation, $paymentMode, $note, $enteredBy);
        
        if ($stmt->execute()) {
            $id = $db->insert_id;
            $insertedIds[] = $id;
            echo "✅ Success (ID: $id)\n";
        } else {
            echo "❌ Failed: " . $stmt->error . "\n";
        }
    }

    // 5. Verify columns in DB for inserted IDs
    echo "\n🔍 Verifying stored data from Database:\n";
    foreach ($insertedIds as $id) {
        $stmt = $db->prepare("SELECT * FROM moi_entries WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        
        echo "\n=== Entry ID: $id ===\n";
        echo "Guest Name: " . $row['guest_name'] . "\n";
        echo "City: " . ($row['city'] ?? 'NULL') . "\n";
        echo "Gift Type: " . $row['gift_type'] . "\n";
        echo "Amount: ₹" . $row['amount'] . "\n";
        echo "Gold Weight: " . ($row['gold_weight'] !== null ? $row['gold_weight'] . "g" : 'NULL') . "\n";
        echo "Gift Desc: " . ($row['gift_description'] ?? 'NULL') . "\n";
        echo "Relation: " . $row['relation'] . "\n";
        echo "Payment Mode: " . $row['payment_mode'] . "\n";
        echo "Note: " . $row['note'] . "\n";
        echo "Entered By: " . $row['entered_by'] . "\n";
        
        // Assert validations are correct
        if ($row['gift_type'] === 'cash') {
            if ($row['amount'] != 1500.00 || $row['city'] !== 'Karaikudi') {
                throw new Exception("Validation failed for Cash Entry!");
            }
        } elseif ($row['gift_type'] === 'gold') {
            if ($row['gold_weight'] != 8.50 || $row['amount'] != 0.00) {
                throw new Exception("Validation failed for Gold Entry!");
            }
        } elseif ($row['gift_type'] === 'gift') {
            if ($row['gift_description'] !== 'Silver Plate' || $row['amount'] != 0.00) {
                throw new Exception("Validation failed for Gift Entry!");
            }
        }
    }
    
    echo "\n🎉 Verification completed successfully. All data matched expectations!\n";

} catch (Exception $e) {
    echo "\n❌ Test encountered an error: " . $e->getMessage() . "\n";
} finally {
    // 6. Clean up everything in reverse order
    echo "\n🧹 Starting Database Cleanup...\n";
    
    if (count($insertedIds) > 0) {
        foreach ($insertedIds as $id) {
            $db->query("DELETE FROM moi_entries WHERE id = $id");
            echo "Cleaned up Test Entry ID: $id\n";
        }
    }
    
    if ($tempEventId !== null) {
        $db->query("DELETE FROM events WHERE id = $tempEventId");
        echo "Cleaned up Temporary Event ID: $tempEventId\n";
    }
    
    if ($tempUserId !== null) {
        $db->query("DELETE FROM users WHERE id = $tempUserId");
        echo "Cleaned up Temporary User ID: $tempUserId\n";
    }
    
    echo "\n✨ Database cleaned up. No residue left!\n";
}
