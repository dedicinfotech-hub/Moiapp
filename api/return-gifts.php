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

// ── GET all return gifts for an event ───────────────────────────────────────
if ($method === 'GET' && $eventId) {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $db = getDB();
    
    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        $stmt = $db->prepare('SELECT id FROM events WHERE id = ? AND user_id = ?');
        $stmt->bind_param('ii', $eventId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    $stmt = $db->prepare("
        SELECT rg.*, me.guest_name as original_guest 
        FROM return_gifts rg 
        LEFT JOIN moi_entries me ON rg.moi_entry_id = me.id 
        WHERE rg.event_id = ? 
        ORDER BY rg.created_at DESC
    ");
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $returnGifts = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'success' => true,
        'return_gifts' => $returnGifts
    ]);
    exit;
}

// ── POST add return gift record ─────────────────────────────────────────────
if ($method === 'POST') {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $evId = intval($data['event_id'] ?? 0);
    $moiEntryId = isset($data['moi_entry_id']) && $data['moi_entry_id'] ? intval($data['moi_entry_id']) : null;
    $guestName = trim($data['guest_name'] ?? '');
    $returnType = $data['return_type'] ?? 'none';
    $returnAmount = isset($data['return_amount']) && $data['return_amount'] ? floatval($data['return_amount']) : null;
    $returnGoldWeight = isset($data['return_gold_weight']) && $data['return_gold_weight'] ? floatval($data['return_gold_weight']) : null;
    $returnGiftDescription = $data['return_gift_description'] ?? null;
    $returnDate = $data['return_date'] ?? null;
    $status = $data['status'] ?? 'pending';
    $note = $data['note'] ?? null;

    if ($evId <= 0 || !$guestName) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID and guest name required']);
        exit;
    }

    $db = getDB();
    
    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        $stmt = $db->prepare('SELECT id FROM events WHERE id = ? AND user_id = ?');
        $stmt->bind_param('ii', $evId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    // Build types and values dynamically to handle null values
    $types = 'i';
    $values = [$evId];
    
    // moi_entry_id - can be null, use 's' for null handling
    $types .= 's';
    $values[] = $moiEntryId;
    
    // guest_name, return_type
    $types .= 'ss';
    $values[] = $guestName;
    $values[] = $returnType;
    
    // return_amount - can be null
    $types .= 'd';
    $values[] = $returnAmount;
    
    // return_gold_weight - can be null
    $types .= 'd';
    $values[] = $returnGoldWeight;
    
    // return_gift_description, return_date, status, note - can be null
    $types .= 'ssss';
    $values[] = $returnGiftDescription;
    $values[] = $returnDate;
    $values[] = $status;
    $values[] = $note;
    
    $stmt = $db->prepare("
        INSERT INTO return_gifts (event_id, moi_entry_id, guest_name, return_type, return_amount, return_gold_weight, return_gift_description, return_date, status, note) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    // Use call_user_func_array to handle null values properly
    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'id' => $db->insert_id
    ]);
    exit;
}

// ── PUT update return gift record ───────────────────────────────────────────
if ($method === 'PUT') {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $entryId = intval($data['id'] ?? 0);
    
    if ($entryId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid return gift ID']);
        exit;
    }

    $fields = [];
    $values = [];

    if (isset($data['return_type'])) {
        $fields[] = "return_type = ?";
        $values[] = $data['return_type'];
    }
    if (isset($data['return_amount'])) {
        $fields[] = "return_amount = ?";
        $values[] = $data['return_amount'] ? floatval($data['return_amount']) : null;
    }
    if (isset($data['return_gold_weight'])) {
        $fields[] = "return_gold_weight = ?";
        $values[] = $data['return_gold_weight'] ? floatval($data['return_gold_weight']) : null;
    }
    if (isset($data['return_gift_description'])) {
        $fields[] = "return_gift_description = ?";
        $values[] = $data['return_gift_description'];
    }
    if (isset($data['return_date'])) {
        $fields[] = "return_date = ?";
        $values[] = $data['return_date'];
    }
    if (isset($data['status'])) {
        $fields[] = "status = ?";
        $values[] = $data['status'];
    }
    if (isset($data['note'])) {
        $fields[] = "note = ?";
        $values[] = $data['note'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $db = getDB();
    
    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        $stmt = $db->prepare('SELECT rg.id FROM return_gifts rg JOIN events e ON rg.event_id = e.id WHERE rg.id = ? AND e.user_id = ?');
        $stmt->bind_param('ii', $entryId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    $values[] = $entryId;
    $types = '';
    foreach ($values as $v) {
        if (is_int($v)) $types .= 'i';
        elseif (is_float($v)) $types .= 'd';
        else $types .= 's';
    }
    
    $stmt = $db->prepare("UPDATE return_gifts SET " . implode(', ', $fields) . " WHERE id = ?");
    // Use call_user_func_array to handle null values properly
    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Return gift updated']);
    exit;
}

// ── DELETE return gift record ─────────────────────────────────────────────
if ($method === 'DELETE') {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $entryId = intval($data['id'] ?? 0);
    
    if ($entryId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid return gift ID']);
        exit;
    }

    $db = getDB();
    
    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        $stmt = $db->prepare('SELECT rg.id FROM return_gifts rg JOIN events e ON rg.event_id = e.id WHERE rg.id = ? AND e.user_id = ?');
        $stmt->bind_param('ii', $entryId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    $stmt = $db->prepare('DELETE FROM return_gifts WHERE id = ?');
    $stmt->bind_param('i', $entryId);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Return gift deleted']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);