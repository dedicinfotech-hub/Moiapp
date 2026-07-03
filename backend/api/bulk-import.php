<?php
/**
 * MoiApp — Bulk Import for Old Moi Notes
 * Allows organizers to upload CSV/Excel files of old moi entries
 * or manually enter digitized entries
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

// Helper function to handle null values in bind_param
function refValues($arr) {
    if (strnatcmp(phpversion(), '5.3') >= 0) {
        $refs = [];
        foreach ($arr as $key => $value) {
            $refs[$key] = &$arr[$key];
        }
        return $refs;
    }
    return $arr;
}

function normalizeEnumValue($value, array $validValues, string $default): string {
    if (!is_string($value)) {
        return $default;
    }

    $normalized = strtolower(trim($value));
    return in_array($normalized, $validValues, true) ? $normalized : $default;
}

const VALID_GIFT_TYPES = ['cash', 'gold', 'silver', 'gift'];
const VALID_RELATIONS = ['family', 'friend', 'colleague', 'relative', 'neighbor', 'business', 'other'];
const VALID_PAYMENT_MODES = ['cash', 'upi', 'card', 'cheque', 'other'];

$method = $_SERVER['REQUEST_METHOD'];
$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$db = getDB();

// ── POST: Import entries from CSV ─────────────────────────────────────────────
if ($method === 'POST' && ($_GET['action'] ?? '') === 'csv') {
    $eventId = intval($_POST['event_id'] ?? 0);
    
    if (!$eventId) {
        http_response_code(400);
        echo json_encode(['error' => 'event_id is required']);
        exit;
    }

    // Verify event ownership or admin access
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';
    if (!$isAdmin) {
        $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
        $stmt->bind_param('ii', $eventId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    if (empty($_FILES['csv_file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'CSV file is required']);
        exit;
    }

    $file = $_FILES['csv_file'];
    if ($file['size'] > 5 * 1024 * 1024) { // 5MB max
        http_response_code(400);
        echo json_encode(['error' => 'File size must be less than 5MB']);
        exit;
    }

    $handle = fopen($file['tmp_name'], 'r');
    if (!$handle) {
        http_response_code(400);
        echo json_encode(['error' => 'Could not open file']);
        exit;
    }

    $imported = 0;
    $errors = [];
    $line = 0;

    // Expected CSV format: guest_name, amount, gift_type, relation, payment_mode, note, original_date
    while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
        $line++;
        if ($line === 1) continue; // Skip header

        if (count($data) < 4) {
            $errors[] = "Line $line: Insufficient columns";
            continue;
        }

        $guestName = trim($data[0] ?? '');
        $amount = floatval($data[1] ?? 0);
        $giftType = normalizeEnumValue($data[2] ?? 'cash', VALID_GIFT_TYPES, 'cash');
        $relation = normalizeEnumValue($data[3] ?? 'friend', VALID_RELATIONS, 'friend');
        $paymentMode = normalizeEnumValue($data[4] ?? 'cash', VALID_PAYMENT_MODES, 'cash');
        $note = trim($data[5] ?? '');
        $originalDate = trim($data[6] ?? '');

        if (!$guestName) {
            $errors[] = "Line $line: Guest name is required";
            continue;
        }

        $goldWeight = null;
        $giftDescription = null;

        if ($giftType === 'cash') {
            if ($amount <= 0) $amount = 0;
        } elseif ($giftType === 'gold') {
            $goldWeight = floatval($data[7] ?? 0);
            $amount = 0;
        } elseif ($giftType === 'gift') {
            $giftDescription = $note;
            $note = '';
            $amount = 0;
        }

        $originalEntryDate = null;
        if ($originalDate && preg_match('/^\d{4}-\d{2}-\d{2}$/', $originalDate)) {
            $originalEntryDate = $originalDate;
        }

        // Build types and values dynamically to handle null values
        $types = 'i';
        $values = [$eventId];
        $types .= 's';
        $values[] = $guestName;
        $types .= 'd';
        $values[] = $amount;
        $types .= 's';
        $values[] = $giftType;
        $types .= 'd';
        $values[] = $goldWeight;
        $types .= 's';
        $values[] = $giftDescription;
        $types .= 's';
        $values[] = $relation;
        $types .= 's';
        $values[] = $paymentMode;
        $types .= 's';
        $values[] = $note;
        $types .= 's';
        $values[] = $user['name'];
        $types .= 's';
        $values[] = $originalEntryDate;
        
        $stmt = $db->prepare('INSERT INTO moi_entries (event_id, guest_name, amount, gift_type, gold_weight, gift_description, relation, payment_mode, note, entered_by, is_digitized, original_entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)');
        $params = array_merge([$types], $values);
        call_user_func_array([$stmt, 'bind_param'], refValues($params));
            
        if ($stmt->execute()) {
            $imported++;
        } else {
            $errors[] = "Line $line: " . $stmt->error;
        }
    }

    fclose($handle);

    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'errors' => $errors,
        'message' => "Successfully imported $imported entries" . (count($errors) > 0 ? " with " . count($errors) . " errors" : "")
    ]);
    exit;
}

// ── POST: Add single digitized entry ─────────────────────────────────────────
if ($method === 'POST' && ($_GET['action'] ?? '') === 'add') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $eventId = intval($data['event_id'] ?? 0);
    $guestName = trim($data['guest_name'] ?? '');
    $amount = floatval($data['amount'] ?? 0);
    $giftType = normalizeEnumValue($data['gift_type'] ?? 'cash', VALID_GIFT_TYPES, 'cash');
    $relation = normalizeEnumValue($data['relation'] ?? 'friend', VALID_RELATIONS, 'friend');
    $paymentMode = normalizeEnumValue($data['payment_mode'] ?? 'cash', VALID_PAYMENT_MODES, 'cash');
    $note = trim($data['note'] ?? '');
    $originalDate = trim($data['original_entry_date'] ?? '');

    if (!$eventId || !$guestName) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID and guest name are required']);
        exit;
    }

    // Verify event ownership
    $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
    $stmt->bind_param('ii', $eventId, $user['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $goldWeight = null;
    $giftDescription = null;

    if ($giftType === 'gold') {
        $goldWeight = floatval($data['gold_weight'] ?? 0);
        $amount = 0;
    } elseif ($giftType === 'gift') {
        $giftDescription = $data['gift_description'] ?? '';
        $amount = 0;
    }

    $originalEntryDate = null;
    if ($originalDate && preg_match('/^\d{4}-\d{2}-\d{2}$/', $originalDate)) {
        $originalEntryDate = $originalDate;
    }

    // Build types and values dynamically to handle null values
    $types = 'i';
    $values = [$eventId];
    $types .= 's';
    $values[] = $guestName;
    $types .= 'd';
    $values[] = $amount;
    $types .= 's';
    $values[] = $giftType;
    $types .= 'd';
    $values[] = $goldWeight;
    $types .= 's';
    $values[] = $giftDescription;
    $types .= 's';
    $values[] = $relation;
    $types .= 's';
    $values[] = $paymentMode;
    $types .= 's';
    $values[] = $note;
    $types .= 's';
    $values[] = $user['name'];
    $types .= 's';
    $values[] = $originalEntryDate;
    
    $stmt = $db->prepare('INSERT INTO moi_entries (event_id, guest_name, amount, gift_type, gold_weight, gift_description, relation, payment_mode, note, entered_by, is_digitized, original_entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)');
    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add entry: ' . $stmt->error]);
    }
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
