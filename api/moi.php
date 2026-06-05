<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$method  = $_SERVER['REQUEST_METHOD'];
$eventId = intval($_GET['event_id'] ?? 0);
$entryId = intval($_GET['id']       ?? 0);

// ── GET all moi entries (admin sees all, user sees own) ───────────────────────
if ($method === 'GET' && $eventId) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    // Check if admin
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
            http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
        }
    }

    $stmt = $db->prepare('SELECT * FROM moi_entries WHERE event_id=? ORDER BY created_at DESC');
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $entries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $stmt2 = $db->prepare('SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total, relation, payment_mode FROM moi_entries WHERE event_id=? GROUP BY relation, payment_mode');
    $stmt2->bind_param('i', $eventId);
    $stmt2->execute();
    $breakdown = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['entries' => $entries, 'breakdown' => $breakdown]);
    exit;
}

// ── POST add moi entry ────────────────────────────────────────────────────────
// Guest (public): sends slug — no auth needed
// Admin:          sends event_id + auth token
// ── POST add moi entry ────────────────────────────────────────────────────────
// Guest (public): sends slug — no auth needed
// Admin:          sends event_id + auth token
if ($method === 'POST') {
    $data            = json_decode(file_get_contents('php://input'), true);
    $guestName       = trim($data['guest_name']       ?? '');
    $city            = isset($data['city']) && trim($data['city']) !== '' ? trim($data['city']) : null;
    $giftType        = trim($data['gift_type']        ?? 'cash');
    $amount          = floatval($data['amount']       ?? 0);
    $goldWeight      = isset($data['gold_weight']) && $data['gold_weight'] !== '' ? floatval($data['gold_weight']) : null;
    $giftDescription = isset($data['gift_description']) && trim($data['gift_description']) !== '' ? trim($data['gift_description']) : null;
    $relation        = $data['relation']              ?? 'friend';
    $paymentMode     = $data['payment_mode']          ?? 'cash';
    $note            = trim($data['note']             ?? '');
    $enteredBy       = trim($data['entered_by']       ?? $guestName);
    $eventSlug       = trim($data['slug']             ?? '');
    $evId            = intval($data['event_id']       ?? 0);

    if (!$guestName) {
        http_response_code(400);
        echo json_encode(['error' => 'Guest name is required']);
        exit;
    }

    if ($giftType === 'cash') {
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount is required for cash entries']);
            exit;
        }
        $goldWeight = null;
        $giftDescription = null;
    } elseif ($giftType === 'gold') {
        if (!$goldWeight || $goldWeight <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Gold weight is required for gold entries']);
            exit;
        }
        $amount = 0;
        $paymentMode = 'cash'; // Reset or default
        $giftDescription = null;
    } elseif ($giftType === 'gift') {
        if (!$giftDescription) {
            http_response_code(400);
            echo json_encode(['error' => 'Gift description is required for gift entries']);
            exit;
        }
        $amount = 0;
        $goldWeight = null;
        $paymentMode = 'cash'; // Reset or default
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid gift type']);
        exit;
    }

    $db = getDB();

    // Public guest flow — resolve event by slug
    if ($eventSlug && !$evId) {
        $stmt = $db->prepare('SELECT id FROM events WHERE slug=? AND is_active=1');
        $stmt->bind_param('s', $eventSlug);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }
        $evId = $row['id'];
    }

    // Admin flow — verify ownership or admin access
    if (!$eventSlug && $evId) {
        $user = getAuthUser();
        if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }
        $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
        $stmtRole->bind_param('i', $user['id']);
        $stmtRole->execute();
        $roleRow = $stmtRole->get_result()->fetch_assoc();
        $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';
        if (!$isAdmin) {
            $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
            $stmt->bind_param('ii', $evId, $user['id']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
            }
        }
    }

    if (!$evId) {
        http_response_code(400);
        echo json_encode(['error' => 'Event not specified']);
        exit;
    }

    $stmt = $db->prepare('INSERT INTO moi_entries (event_id, guest_name, city, amount, gift_type, gold_weight, gift_description, relation, payment_mode, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('issdsdsssss', $evId, $guestName, $city, $amount, $giftType, $goldWeight, $giftDescription, $relation, $paymentMode, $note, $enteredBy);
    $stmt->execute();

    echo json_encode(['success' => true, 'id' => $db->insert_id]);
    exit;
}

// ── DELETE moi entry (admin can delete any, user can delete own) ──────────────
if ($method === 'DELETE' && $entryId) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if ($isAdmin) {
        $stmt = $db->prepare('DELETE FROM moi_entries WHERE id=?');
        $stmt->bind_param('i', $entryId);
    } else {
        $stmt = $db->prepare('DELETE m FROM moi_entries m JOIN events e ON m.event_id = e.id WHERE m.id=? AND e.user_id=?');
        $stmt->bind_param('ii', $entryId, $user['id']);
    }
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
