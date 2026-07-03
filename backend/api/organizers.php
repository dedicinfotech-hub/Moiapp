<?php
/**
 * MoiApp — Multi-Organizer Support
 * Allows multiple users to manage the same event
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

// ── GET: List organizers for an event ─────────────────────────────────────────
if ($method === 'GET' && isset($_GET['event_id'])) {
    $eventId = intval($_GET['event_id']);
    
    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        // Verify user has access to this event
        $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
        $stmt->bind_param('ii', $eventId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    $stmt = $db->prepare('
        SELECT o.id, o.user_id, u.name, u.email, o.role, o.added_at 
        FROM event_organizers o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.event_id = ?
        ORDER BY o.added_at ASC
    ');
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $organizers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['organizers' => $organizers]);
    exit;
}

// ── POST: Add organizer to event ──────────────────────────────────────────────
if ($method === 'POST' && ($_GET['action'] ?? '') === 'add') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $eventId = intval($data['event_id'] ?? 0);
    $email = trim($data['email'] ?? '');
    $role = strtolower(trim($data['role'] ?? 'organizer'));

    if (!$eventId || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID and email are required']);
        exit;
    }

    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        // Verify user owns the event
        $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
        $stmt->bind_param('ii', $eventId, $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    // Find user by email
    $stmt = $db->prepare('SELECT id, name FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $targetUser = $stmt->get_result()->fetch_assoc();

    if (!$targetUser) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found with this email. They need to register first.']);
        exit;
    }

    // Check if already an organizer
    $stmt = $db->prepare('SELECT id FROM event_organizers WHERE event_id=? AND user_id=?');
    $stmt->bind_param('ii', $eventId, $targetUser['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'User is already an organizer for this event']);
        exit;
    }

    // Add organizer
    $stmt = $db->prepare('INSERT INTO event_organizers (event_id, user_id, role) VALUES (?, ?, ?)');
    $stmt->bind_param('iis', $eventId, $targetUser['id'], $role);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'organizer' => [
                'id' => $db->insert_id,
                'user_id' => $targetUser['id'],
                'name' => $targetUser['name'],
                'email' => $email,
                'role' => $role
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add organizer']);
    }
    exit;
}

// ── DELETE: Remove organizer from event ──────────────────────────────────────
if ($method === 'DELETE' && isset($_GET['id'])) {
    $organizerId = intval($_GET['id']);
    
    // Get event_id for this organizer
    $stmt = $db->prepare('SELECT event_id FROM event_organizers WHERE id=?');
    $stmt->bind_param('i', $organizerId);
    $stmt->execute();
    $org = $stmt->get_result()->fetch_assoc();
    
    if (!$org) {
        http_response_code(404);
        echo json_encode(['error' => 'Organizer not found']);
        exit;
    }

    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    if (!$isAdmin) {
        // Verify user owns the event
        $stmt = $db->prepare('SELECT id FROM events WHERE id=? AND user_id=?');
        $stmt->bind_param('ii', $org['event_id'], $user['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    $stmt = $db->prepare('DELETE FROM event_organizers WHERE id=?');
    $stmt->bind_param('i', $organizerId);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
