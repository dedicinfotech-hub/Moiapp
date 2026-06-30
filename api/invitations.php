<?php
/**
 * MoiApp — Invitations API
 * Handles invitation list upload and management
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/spreadsheet.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$db = getDB();

// ── GET: List invitations for an event ───────────────────────────────────────
if ($method === 'GET' && ($_GET['action'] ?? '') === 'list') {
    $eventId = intval($_GET['event_id'] ?? 0);
    
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

    $stmt = $db->prepare('SELECT * FROM invitations WHERE event_id = ? ORDER BY created_at DESC');
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $invitations = [];
    while ($row = $result->fetch_assoc()) {
        $invitations[] = $row;
    }
    
    echo json_encode(['invitations' => $invitations]);
    exit;
}

// ── POST: Upload invitations from CSV ─────────────────────────────────────────
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
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($ext, ['csv', 'xlsx'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Only CSV and XLSX files are supported']);
        exit;
    }

    try {
        $allRows = parseSpreadsheetRows($file['tmp_name'], $ext);
    } catch (RuntimeException $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }

    if (empty($allRows)) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to read file or file is empty']);
        exit;
    }

    $header = array_map('strtolower', array_map('trim', $allRows[0]));
    $requiredColumns = ['name', 'phone', 'relation', 'city'];
    $headerMap = $header;

    $missingColumns = array_filter($requiredColumns, function ($col) use ($headerMap) {
        return !in_array($col, $headerMap, true);
    });

    if (count($missingColumns) > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required columns: ' . implode(', ', $missingColumns)]);
        exit;
    }

    $nameIdx = array_search('name', $headerMap, true);
    $phoneIdx = array_search('phone', $headerMap, true);
    $relationIdx = array_search('relation', $headerMap, true);
    $cityIdx = array_search('city', $headerMap, true);

    $stmt = $db->prepare('INSERT INTO invitations (event_id, name, phone, relation, city) VALUES (?, ?, ?, ?, ?)');
    $count = 0;
    $invalid = 0;
    $errors = [];
    $seenPhones = [];

    for ($i = 1, $n = count($allRows); $i < $n; $i++) {
        $rowNum = $i + 1;
        $row = $allRows[$i];
        $name = trim($row[$nameIdx] ?? '');
        $phone = preg_replace('/\D/', '', trim($row[$phoneIdx] ?? ''));
        $relation = strtolower(trim($row[$relationIdx] ?? 'friend'));
        $city = trim($row[$cityIdx] ?? '');

        if ($name === '') {
            $invalid++;
            if (count($errors) < 25) {
                $errors[] = "Row {$rowNum}: Missing name";
            }
            continue;
        }

        if ($phone !== '' && strlen($phone) !== 10) {
            $invalid++;
            if (count($errors) < 25) {
                $errors[] = "Row {$rowNum}: Invalid phone number";
            }
            continue;
        }

        if ($phone !== '' && isset($seenPhones[$phone])) {
            $invalid++;
            if (count($errors) < 25) {
                $errors[] = "Row {$rowNum}: Duplicate phone number";
            }
            continue;
        }

        if ($phone !== '') {
            $seenPhones[$phone] = true;
        }

        $stmt->bind_param('issss', $eventId, $name, $phone, $relation, $city);
        $stmt->execute();
        $count++;
    }

    echo json_encode([
        'success' => true,
        'count' => $count,
        'valid' => $count,
        'invalid' => $invalid,
        'total' => max(0, count($allRows) - 1),
        'errors' => $errors,
    ]);
    exit;
}

// ── PUT: Update invitation status ───────────────────────────────────────────
if ($method === 'PUT' && ($_GET['action'] ?? '') === 'update') {
    $input = json_decode(file_get_contents('php://input'), true);
    $invitationId = intval($input['id'] ?? 0);
    $status = $input['status'] ?? 'invited';
    
    if (!$invitationId) {
        http_response_code(400);
        echo json_encode(['error' => 'invitation_id is required']);
        exit;
    }

    // Verify ownership
    $stmt = $db->prepare('SELECT i.event_id FROM invitations i JOIN events e ON i.event_id = e.id WHERE i.id = ? AND e.user_id = ?');
    $stmt->bind_param('ii', $invitationId, $user['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $db->prepare('UPDATE invitations SET status = ? WHERE id = ?');
    $stmt->bind_param('si', $status, $invitationId);
    $stmt->execute();
    
    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE: Delete invitation ───────────────────────────────────────────────
if ($method === 'DELETE' && ($_GET['action'] ?? '') === 'delete') {
    $invitationId = intval($_GET['id'] ?? 0);
    
    if (!$invitationId) {
        http_response_code(400);
        echo json_encode(['error' => 'invitation_id is required']);
        exit;
    }

    // Verify ownership
    $stmt = $db->prepare('SELECT i.event_id FROM invitations i JOIN events e ON i.event_id = e.id WHERE i.id = ? AND e.user_id = ?');
    $stmt->bind_param('ii', $invitationId, $user['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $db->prepare('DELETE FROM invitations WHERE id = ?');
    $stmt->bind_param('i', $invitationId);
    $stmt->execute();
    
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);