<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'];
$slug   = $_GET['slug']   ?? '';
$id     = intval($_GET['id'] ?? 0);
$public = $_GET['public'] ?? '';
$action = $_GET['action'] ?? '';

// ── POST upload cover photo ───────────────────────────────────────────────────
if ($method === 'POST' && $action === 'cover') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $evId = intval($_POST['event_id'] ?? 0);
    if (!$evId || empty($_FILES['cover'])) {
        http_response_code(400); echo json_encode(['error' => 'event_id and cover file required']); exit;
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM events WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ii', $evId, $user['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
    }

    $file     = $_FILES['cover'];
    $allowed  = ['image/jpeg', 'image/png', 'image/webp'];
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowed)) {
        http_response_code(400); echo json_encode(['error' => 'Only JPG, PNG, WEBP allowed']); exit;
    }
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400); echo json_encode(['error' => 'Max 10MB']); exit;
    }

    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
    $subDir   = 'covers/' . date('Y/m');
    $uploadDir = dirname(__DIR__) . '/uploads/' . $subDir . '/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $filename = 'cover_' . $evId . '_' . uniqid() . '.' . $ext;
    move_uploaded_file($file['tmp_name'], $uploadDir . $filename);

    $appUrl    = rtrim(env('APP_URL', 'http://localhost:8888/MoiApp'), '/');
    $coverUrl  = $appUrl . '/uploads/' . $subDir . '/' . $filename;

    $stmt = $db->prepare('UPDATE events SET cover_photo = ? WHERE id = ?');
    $stmt->bind_param('si', $coverUrl, $evId);
    $stmt->execute();

    echo json_encode(['success' => true, 'url' => $coverUrl]);
    exit;
}

// ── GET all events PUBLIC listing ─────────────────────────────────────────────
if ($method === 'GET' && $public === '1') {
    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT e.id, e.slug, e.bride_name, e.groom_name, e.wedding_date, e.venue,
                e.cover_photo, e.description, e.created_at,
                u.name as creator_name,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE e.is_active = 1
         ORDER BY e.wedding_date ASC'
    );
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ── GET single event by slug (PUBLIC — no auth needed) ────────────────────────
if ($method === 'GET' && $slug) {
    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT e.*, u.name as creator_name,
                u.upi_id, u.bank_name, u.account_number, u.ifsc_code, u.account_holder, u.phone as organizer_phone
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE e.slug = ? AND e.is_active = 1'
    );
    $stmt->bind_param('s', $slug);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();

    if (!$event) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
        exit;
    }

    // Public stats
    $stmt2 = $db->prepare('SELECT COUNT(*) as guest_count, COALESCE(SUM(amount),0) as total FROM moi_entries WHERE event_id = ?');
    $stmt2->bind_param('i', $event['id']);
    $stmt2->execute();
    $event['stats'] = $stmt2->get_result()->fetch_assoc();

    echo json_encode($event);
    exit;
}

// ── GET all events for logged-in user ─────────────────────────────────────────
if ($method === 'GET') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT e.*,
            (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
            (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi
         FROM events e
         WHERE e.user_id = ?
         ORDER BY e.created_at DESC'
    );
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ── POST create event ─────────────────────────────────────────────────────────
if ($method === 'POST') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $data        = json_decode(file_get_contents('php://input'), true);
    $bride       = trim($data['bride_name']    ?? '');
    $groom       = trim($data['groom_name']    ?? '');
    $date        = $data['wedding_date']        ?? '';
    $venue       = trim($data['venue']          ?? '');
    $description = trim($data['description']   ?? '');

    if (!$bride || !$groom || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Bride name, groom name and wedding date required']);
        exit;
    }

    $slug = generateSlug($bride, $groom, $date);
    $db   = getDB();
    $stmt = $db->prepare('INSERT INTO events (user_id, slug, bride_name, groom_name, wedding_date, venue, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('issssss', $user['id'], $slug, $bride, $groom, $date, $venue, $description);
    $stmt->execute();
    $eventId = $db->insert_id;

    echo json_encode(['success' => true, 'id' => $eventId, 'slug' => $slug]);
    exit;
}

// ── PUT update event ──────────────────────────────────────────────────────────
if ($method === 'PUT' && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $data  = json_decode(file_get_contents('php://input'), true);
    $bride = trim($data['bride_name']  ?? '');
    $groom = trim($data['groom_name']  ?? '');
    $date  = $data['wedding_date']      ?? '';
    $venue = trim($data['venue']        ?? '');
    $desc  = trim($data['description'] ?? '');

    $db   = getDB();
    $stmt = $db->prepare('UPDATE events SET bride_name=?, groom_name=?, wedding_date=?, venue=?, description=? WHERE id=? AND user_id=?');
    $stmt->bind_param('sssssii', $bride, $groom, $date, $venue, $desc, $id, $user['id']);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE event ──────────────────────────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    $stmt = $db->prepare('DELETE FROM events WHERE id=? AND user_id=?');
    $stmt->bind_param('ii', $id, $user['id']);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);

function generateSlug(string $bride, string $groom, string $date): string {
    $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $bride . $groom));
    return $base . '-' . str_replace('-', '', $date) . '-' . substr(uniqid(), -4);
}
