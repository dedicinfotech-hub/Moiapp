<?php
/**
 * Offline Sync API
 * Handles syncing of offline moi entries when connection is restored
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

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

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $entries = $data['entries'] ?? [];

    if (!is_array($entries) || empty($entries)) {
        http_response_code(400);
        echo json_encode(['error' => 'No entries provided']);
        exit;
    }

    $synced = [];
    $failed = [];

    foreach ($entries as $entry) {
        $eventId = intval($entry['event_id'] ?? 0);
        $guestName = trim($entry['guest_name'] ?? '');
        $amount = floatval($entry['amount'] ?? 0);
        $giftType = normalizeEnumValue($entry['gift_type'] ?? 'cash', VALID_GIFT_TYPES, 'cash');

        if (!$eventId || !$guestName) {
            $failed[] = ['entry' => $entry, 'reason' => 'Missing event_id or guest_name'];
            continue;
        }

        // Verify event ownership
        $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
        $stmt->bind_param('ii', $eventId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            $failed[] = ['entry' => $entry, 'reason' => 'Event not found or access denied'];
            continue;
        }

        // Insert entry
        $stmt = $db->prepare('INSERT INTO moi_entries (event_id, guest_name, city, company, occupation, amount, gift_type, gold_weight, gift_description, approximate_value, relation, payment_mode, upi_ref_id, other_payment_details, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $city = $entry['city'] ?? null;
        $company = $entry['company'] ?? null;
        $occupation = $entry['occupation'] ?? null;
        $goldWeight = isset($entry['gold_weight']) && $entry['gold_weight'] !== '' ? floatval($entry['gold_weight']) : null;
        $giftDescription = isset($entry['gift_description']) && trim($entry['gift_description']) !== '' ? trim($entry['gift_description']) : null;
        $approximateValue = isset($entry['approximate_value']) && $entry['approximate_value'] !== '' && $entry['approximate_value'] !== null ? floatval($entry['approximate_value']) : null;
        $relation = normalizeEnumValue($entry['relation'] ?? 'friend', VALID_RELATIONS, 'friend');
        $paymentMode = normalizeEnumValue($entry['payment_mode'] ?? 'cash', VALID_PAYMENT_MODES, 'cash');
        $upiRefId = $entry['upi_ref_id'] ?? null;
        $otherDetails = $entry['other_payment_details'] ?? null;
        $note = trim($entry['note'] ?? '');
        $enteredBy = trim($entry['entered_by'] ?? 'offline_sync');

        $stmt->bind_param('isssssdsssssssss', $eventId, $guestName, $city, $company, $occupation, $amount, $giftType, $goldWeight, $giftDescription, $approximateValue, $relation, $paymentMode, $upiRefId, $otherDetails, $note, $enteredBy);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $synced[] = [
                'id' => $db->insert_id,
                'guest_name' => $guestName,
                'client_id' => $entry['id'] ?? null,
            ];
        } else {
            $failed[] = ['entry' => $entry, 'reason' => 'Database insert failed'];
        }
    }

    echo json_encode([
        'success' => true,
        'synced_count' => count($synced),
        'failed_count' => count($failed),
        'synced' => $synced,
        'failed' => $failed,
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
