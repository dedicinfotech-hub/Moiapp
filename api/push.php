<?php
/**
 * Device push token registration (Expo Push)
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

$tableExists = $db->query("SHOW TABLES LIKE 'device_push_tokens'")->num_rows > 0;
if (!$tableExists) {
    http_response_code(503);
    echo json_encode(['error' => 'Push tokens table not migrated yet']);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $token = trim($data['token'] ?? '');
    $platform = trim($data['platform'] ?? 'unknown');

    if ($token === '') {
        http_response_code(400);
        echo json_encode(['error' => 'token is required']);
        exit;
    }

    $stmt = $db->prepare('
        INSERT INTO device_push_tokens (user_id, expo_push_token, platform, is_active, updated_at)
        VALUES (?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), is_active = 1, updated_at = NOW()
    ');
    $stmt->bind_param('iss', $user['id'], $token, $platform);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $token = trim($data['token'] ?? '');

    if ($token !== '') {
        $stmt = $db->prepare('UPDATE device_push_tokens SET is_active = 0, updated_at = NOW() WHERE expo_push_token = ? AND user_id = ?');
        $stmt->bind_param('si', $token, $user['id']);
        $stmt->execute();
    } else {
        $stmt = $db->prepare('UPDATE device_push_tokens SET is_active = 0, updated_at = NOW() WHERE user_id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
