<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$method  = $_SERVER['REQUEST_METHOD'];
$eventId = intval($_GET['event_id'] ?? 0);
$photoId = intval($_GET['id']       ?? 0);

// ── GET photos for event (PUBLIC) ─────────────────────────────────────────────
if ($method === 'GET' && $eventId) {
    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM photos WHERE event_id = ? ORDER BY uploaded_at DESC');
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$row) {
        $row['s3_url'] = normalizeCoverUrl($row['s3_url']);
    }
    echo json_encode($rows);
    exit;
}

// ── POST upload photo ─────────────────────────────────────────────────────────
if ($method === 'POST') {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $evId    = intval($_POST['event_id'] ?? 0);
    $caption = trim($_POST['caption']   ?? '');

    if (!$evId || empty($_FILES['photo'])) {
        http_response_code(400);
        echo json_encode(['error' => 'event_id and photo file are required']);
        exit;
    }

    // Verify the event belongs to this user or user is admin
    $db   = getDB();
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

    $file     = $_FILES['photo'];
    $allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $mimeType = mime_content_type($file['tmp_name']);

    if (!in_array($mimeType, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Only JPG, PNG, WEBP, GIF allowed']);
        exit;
    }
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Max file size is 10 MB']);
        exit;
    }

    // ── Save to /uploads/photos/YYYY/MM/ ─────────────────────────────────────
    $ext       = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
    $subDir    = date('Y') . '/' . date('m');
    $uploadDir = dirname(__DIR__) . '/uploads/photos/' . $subDir . '/';

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not create upload directory']);
        exit;
    }

    $filename = uniqid('photo_', true) . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
        exit;
    }

    // ── Build public URL ──────────────────────────────────────────────────────
    // APP_URL = e.g. https://dsitesai.com/moiapp  (no trailing slash)
    $appUrl   = rtrim(env('APP_URL', 'http://localhost:8888/MoiApp'), '/');
    $fileKey  = 'uploads/photos/' . $subDir . '/' . $filename;
    $fileUrl  = $appUrl . '/' . $fileKey;

    // ── Insert into DB ────────────────────────────────────────────────────────
    $stmt = $db->prepare(
        'INSERT INTO photos (event_id, s3_key, s3_url, caption) VALUES (?, ?, ?, ?)'
    );
    $stmt->bind_param('isss', $evId, $fileKey, $fileUrl, $caption);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'id'      => $db->insert_id,
        'url'     => $fileUrl,
        'key'     => $fileKey,
    ]);
    exit;
}

// ── DELETE photo ──────────────────────────────────────────────────────────────
if ($method === 'DELETE' && $photoId) {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $db   = getDB();

    // Check if admin
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

    // Fetch the file key before deleting so we can remove the file too
    if ($isAdmin) {
        $stmt = $db->prepare('SELECT p.s3_key FROM photos p WHERE p.id = ?');
        $stmt->bind_param('i', $photoId);
    } else {
        $stmt = $db->prepare(
            'SELECT p.s3_key FROM photos p
             JOIN events e ON p.event_id = e.id
             WHERE p.id = ? AND e.user_id = ?'
        );
        $stmt->bind_param('ii', $photoId, $user['id']);
    }
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo not found or access denied']);
        exit;
    }

    // Delete the physical file
    $filePath = dirname(__DIR__) . '/' . $row['s3_key'];
    if (file_exists($filePath)) {
        @unlink($filePath);
    }

    // Delete the DB record
    $stmt = $db->prepare('DELETE FROM photos WHERE id = ?');
    $stmt->bind_param('i', $photoId);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
