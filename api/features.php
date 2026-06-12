<?php
require_once __DIR__ . '/../config/bootstrap.php';
$method = $_SERVER['REQUEST_METHOD'];

// GET endpoint is public (no auth required)
if ($method === 'GET') {
  try {
    $pdo = getPDO();
    $stmt = $pdo->query("SELECT feature_key, is_enabled, description FROM feature_toggles ORDER BY feature_key");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['toggles' => $rows]);
  } catch (Exception $e) {
    // Table may not exist yet — return empty toggles
    echo json_encode(['toggles' => []]);
  }
  exit;
}

// Other methods require authentication
$token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
$user = getAuthUser();
if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

// Fetch user role from database
$db = getDB();
$stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
$stmt->bind_param('i', $user['id']);
$stmt->execute();
$roleRow = $stmt->get_result()->fetch_assoc();
$userRole = $roleRow['role'] ?? 'user';

if ($method === 'PUT' || $method === 'POST') {
  // Only admin can update feature toggles
  if ($userRole !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Admin privileges required.']);
    exit;
  }
  $input = json_decode(file_get_contents('php://input'), true);
  if (empty($input['feature_key']) || !isset($input['is_enabled'])) {
    http_response_code(400); echo json_encode(['error' => 'feature_key and is_enabled required']); exit;
  }
  try {
    $pdo = getPDO();
    $stmt = $pdo->prepare("UPDATE feature_toggles SET is_enabled = ?, updated_by = ? WHERE feature_key = ?");
    $stmt->execute([(int)$input['is_enabled'], $user['id'], $input['feature_key']]);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update feature toggle']);
    exit;
  }
  echo json_encode(['success' => true]);
  exit;
}

http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
