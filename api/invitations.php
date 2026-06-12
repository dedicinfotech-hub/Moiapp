<?php
/**
 * MoiApp — Invitations API
 * Handles invitation list upload and management
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

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

    $handle = fopen($file['tmp_name'], 'r');
    if (!$handle) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to read file']);
        exit;
    }

    $header = fgetcsv($handle);
    $requiredColumns = ['name', 'phone', 'relation', 'city'];
    $headerMap = array_map('strtolower', $header);
    
    $missingColumns = array_filter($requiredColumns, function($col) use ($headerMap) {
        return !in_array($col, $headerMap);
    });
    
    if (count($missingColumns) > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required columns: ' . implode(', ', $missingColumns)]);
        exit;
    }

    $nameIdx = array_search('name', $headerMap);
    $phoneIdx = array_search('phone', $headerMap);
    $relationIdx = array_search('relation', $headerMap);
    $cityIdx = array_search('city', $headerMap);

    $stmt = $db->prepare('INSERT INTO invitations (event_id, name, phone, relation, city) VALUES (?, ?, ?, ?, ?)');
    $count = 0;
    
    while (($row = fgetcsv($handle)) !== false) {
        $name = trim($row[$nameIdx] ?? '');
        $phone = trim($row[$phoneIdx] ?? '');
        $relation = strtolower(trim($row[$relationIdx] ?? 'friend'));
        $city = trim($row[$cityIdx] ?? '');
        
        if ($name) {
            $stmt->bind_param('issss', $eventId, $name, $phone, $relation, $city);
            $stmt->execute();
            $count++;
        }
    }
    
    fclose($handle);
    echo json_encode(['success' => true, 'count' => $count]);
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