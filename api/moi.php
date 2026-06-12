<?php
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
    $company         = isset($data['company']) && trim($data['company']) !== '' ? trim($data['company']) : null;
    $occupation      = isset($data['occupation']) && trim($data['occupation']) !== '' ? trim($data['occupation']) : null;
    $giftType        = trim($data['gift_type']        ?? 'cash');
    $approximateValue = isset($data['approximate_value']) && $data['approximate_value'] !== '' && $data['approximate_value'] !== null ? floatval($data['approximate_value']) : null;
    if (!in_array($giftType, ['cash', 'gold', 'silver', 'gift'])) {
        $giftType = 'cash';
    }
    $amount          = floatval($data['amount']       ?? 0);
    $goldWeight      = isset($data['gold_weight']) && $data['gold_weight'] !== '' ? floatval($data['gold_weight']) : null;
    $giftDescription = isset($data['gift_description']) && trim($data['gift_description']) !== '' ? trim($data['gift_description']) : null;
    $relation        = $data['relation']              ?? 'friend';
    
    // Validate relation
    $validRelations = ['family', 'friend', 'colleague', 'relative', 'neighbor', 'business', 'other'];
    if (!in_array($relation, $validRelations)) {
        $relation = 'other';
    }
    $paymentMode     = $data['payment_mode']          ?? 'cash';
    $note            = trim($data['note']             ?? '');
    $enteredBy       = trim($data['entered_by']       ?? $guestName);
    $eventSlug       = trim($data['slug']             ?? '');
    $guestToken      = trim($data['guest_token']      ?? '');
    $evId            = intval($data['event_id']       ?? 0);
    $isGuestQr       = false;

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
    } elseif ($giftType === 'gold' || $giftType === 'silver') {
        if (!$giftDescription) {
            http_response_code(400);
            echo json_encode(['error' => 'Item name is required for ' . $giftType . ' entries']);
            exit;
        }
        if (!$goldWeight || $goldWeight <= 0) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst($giftType) . ' weight is required for ' . $giftType . ' entries']);
            exit;
        }
        $amount = 0;
        $paymentMode = 'cash';
    } elseif ($giftType === 'gift') {
        if (!$giftDescription) {
            http_response_code(400);
            echo json_encode(['error' => 'Item name is required for gift entries']);
            exit;
        }
        $amount = 0;
        $goldWeight = null;
        $paymentMode = 'cash';
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid gift type']);
        exit;
    }

    $db = getDB();

    // Private QR guest flow — resolve event by guest_token
    if ($guestToken && !$evId) {
        $stmt = $db->prepare(
            'SELECT id FROM events WHERE guest_token=? AND is_active=1
             AND event_mode=\'new\' AND approval_status=\'approved\' AND qr_enabled=1'
        );
        $stmt->bind_param('s', $guestToken);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(403);
            echo json_encode(['error' => 'This payment link is invalid or has been closed by the host.']);
            exit;
        }
        $evId = $row['id'];
        $isGuestQr = true;
        $enteredBy = 'guest_qr';
    }

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
    if (!$eventSlug && !$guestToken && $evId) {
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

    // Block moi entry until new events are approved (admin may bypass)
    $stmtEv = $db->prepare('SELECT event_mode, approval_status, approval_reason, qr_enabled FROM events WHERE id = ?');
    $stmtEv->bind_param('i', $evId);
    $stmtEv->execute();
    $evRow = $stmtEv->get_result()->fetch_assoc();
    if ($evRow && $evRow['event_mode'] === 'new' && $evRow['approval_status'] !== 'approved') {
        $bypass = false;
        if (!$eventSlug && !$guestToken) {
            $authUser = getAuthUser();
            if ($authUser) {
                $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
                $stmtRole->bind_param('i', $authUser['id']);
                $stmtRole->execute();
                $roleRow = $stmtRole->get_result()->fetch_assoc();
                $bypass = ($roleRow['role'] ?? 'user') === 'admin';
            }
        }
        if (!$bypass) {
            http_response_code(403);
            echo json_encode([
                'error' => $evRow['approval_status'] === 'rejected'
                    ? 'Function was rejected. Please edit and resubmit for approval.'
                    : 'Function is pending admin approval. You cannot add moi entries yet.',
                'approval_status' => $evRow['approval_status'],
                'approval_reason' => $evRow['approval_reason'],
            ]);
            exit;
        }
    }

    // Build types and values dynamically to handle null values
    $upiRefId = isset($data['upi_ref_id']) && trim($data['upi_ref_id']) !== '' ? trim($data['upi_ref_id']) : null;
    $otherPaymentDetails = isset($data['other_payment_details']) && trim($data['other_payment_details']) !== '' ? trim($data['other_payment_details']) : null;
    
    $types = 'i';
    $values = [$evId];
    $types .= 's';
    $values[] = $guestName;
    $types .= 's';
    $values[] = $city;
    $types .= 's';
    $values[] = $company;
    $types .= 's';
    $values[] = $occupation;
    $types .= 'd';
    $values[] = $amount;
    $types .= 's';
    $values[] = $giftType;
    $types .= 'd';
    $values[] = $goldWeight;
    $types .= 's';
    $values[] = $giftDescription;
    $types .= 'd';
    $values[] = $approximateValue;
    $types .= 's';
    $values[] = $relation;
    $types .= 's';
    $values[] = $paymentMode;
    $types .= 's';
    $values[] = $upiRefId;
    $types .= 's';
    $values[] = $otherPaymentDetails;
    $types .= 's';
    $values[] = $note;
    $types .= 's';
    $values[] = $enteredBy;
    
    $stmt = $db->prepare('INSERT INTO moi_entries (event_id, guest_name, city, company, occupation, amount, gift_type, gold_weight, gift_description, approximate_value, relation, payment_mode, upi_ref_id, other_payment_details, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    // Use call_user_func_array to handle null values properly
    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
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

// ── PUT update moi entry (admin can update any, user can update own) ───────────
if ($method === 'PUT' && $entryId) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $data = json_decode(file_get_contents('php://input'), true);
    $guestName = trim($data['guest_name'] ?? '');
    $city = isset($data['city']) && trim($data['city']) !== '' ? trim($data['city']) : null;
    $giftType = trim($data['gift_type'] ?? 'cash');
    $approximateValue = isset($data['approximate_value']) && $data['approximate_value'] !== '' && $data['approximate_value'] !== null ? floatval($data['approximate_value']) : null;
    $amount = floatval($data['amount'] ?? 0);
    $goldWeight = isset($data['gold_weight']) && $data['gold_weight'] !== '' ? floatval($data['gold_weight']) : null;
    $giftDescription = isset($data['gift_description']) && trim($data['gift_description']) !== '' ? trim($data['gift_description']) : null;
    $relation = $data['relation'] ?? 'friend';
    $paymentMode = $data['payment_mode'] ?? 'cash';
    $upiRefId = isset($data['upi_ref_id']) && trim($data['upi_ref_id']) !== '' ? trim($data['upi_ref_id']) : null;
    $otherPaymentDetails = isset($data['other_payment_details']) && trim($data['other_payment_details']) !== '' ? trim($data['other_payment_details']) : null;
    $note = trim($data['note'] ?? '');
    $enteredBy = trim($data['entered_by'] ?? $guestName);

    // Validate relation
    $validRelations = ['family', 'friend', 'colleague', 'relative', 'neighbor', 'business', 'other'];
    if (!in_array($relation, $validRelations)) {
        $relation = 'other';
    }

    // Validate gift type
    if ($giftType === 'cash') {
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount is required for cash entries']);
            exit;
        }
        $goldWeight = null;
        $giftDescription = null;
    } elseif ($giftType === 'gold' || $giftType === 'silver') {
        if (!$giftDescription) {
            http_response_code(400);
            echo json_encode(['error' => 'Item name is required for ' . $giftType . ' entries']);
            exit;
        }
        if (!$goldWeight || $goldWeight <= 0) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst($giftType) . ' weight is required for ' . $giftType . ' entries']);
            exit;
        }
        $amount = 0;
        $paymentMode = 'cash';
    } elseif ($giftType === 'gift') {
        if (!$giftDescription) {
            http_response_code(400);
            echo json_encode(['error' => 'Item name is required for gift entries']);
            exit;
        }
        $amount = 0;
        $goldWeight = null;
        $paymentMode = 'cash';
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid gift type']);
        exit;
    }

    $db = getDB();
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if ($isAdmin) {
        $stmt = $db->prepare('UPDATE moi_entries SET guest_name=?, city=?, company=?, occupation=?, amount=?, gift_type=?, gold_weight=?, gift_description=?, approximate_value=?, relation=?, payment_mode=?, upi_ref_id=?, other_payment_details=?, note=?, entered_by=? WHERE id=?');
        $types = 'ssssdsssdssssssi';
        $values = [$guestName, $city, $company, $occupation, $amount, $giftType, $goldWeight, $giftDescription, $approximateValue, $relation, $paymentMode, $upiRefId, $otherPaymentDetails, $note, $enteredBy, $entryId];
    } else {
        $stmt = $db->prepare('UPDATE moi_entries m JOIN events e ON m.event_id = e.id SET m.guest_name=?, m.city=?, m.company=?, m.occupation=?, m.amount=?, m.gift_type=?, m.gold_weight=?, m.gift_description=?, m.approximate_value=?, m.relation=?, m.payment_mode=?, m.upi_ref_id=?, m.other_payment_details=?, m.note=?, m.entered_by=? WHERE m.id=? AND e.user_id=?');
        $types = 'ssssdsssdssssssii';
        $values = [$guestName, $city, $company, $occupation, $amount, $giftType, $goldWeight, $giftDescription, $approximateValue, $relation, $paymentMode, $upiRefId, $otherPaymentDetails, $note, $enteredBy, $entryId, $user['id']];
    }

    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
