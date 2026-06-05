<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── Register ──────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'register') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $name  = trim($data['name']  ?? '');
    $email = trim($data['email'] ?? '');
    $pass  = $data['password']   ?? '';
    $phone = trim($data['phone'] ?? '');

    if (!$name || !$email || !$pass) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, email and password required']);
        exit;
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('ssss', $name, $email, $hash, $phone);
    $stmt->execute();
    $userId = $db->insert_id;

    $token = makeToken($userId, $email);
    echo json_encode(['success' => true, 'token' => $token, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'user']]);
    exit;
}

// ── Login ─────────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email']    ?? '');
    $pass  = $data['password'] ?? '';

    if (!$email || !$pass) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        exit;
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, password, role FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($pass, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }

    $token = makeToken($user['id'], $user['email']);
    echo json_encode(['success' => true, 'token' => $token, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role'] ?? 'user']]);
    exit;
}

// ── Me (verify token) ─────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'me') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, phone, upi_id, bank_name, account_number, ifsc_code, account_holder, role FROM users WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    echo json_encode(['user' => $row ?: $user]);
    exit;
}

// ── PUT update profile + payment details ──────────────────────────────────────
if ($method === 'PUT' && $action === 'profile') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $data           = json_decode(file_get_contents('php://input'), true);
    $name           = trim($data['name']           ?? '');
    $phone          = trim($data['phone']          ?? '');
    $upi_id         = trim($data['upi_id']         ?? '');
    $bank_name      = trim($data['bank_name']      ?? '');
    $account_number = trim($data['account_number'] ?? '');
    $ifsc_code      = trim($data['ifsc_code']      ?? '');
    $account_holder = trim($data['account_holder'] ?? '');

    if (!$name) { http_response_code(400); echo json_encode(['error' => 'Name is required']); exit; }

    $db   = getDB();
    $stmt = $db->prepare(
        'UPDATE users SET name=?, phone=?, upi_id=?, bank_name=?, account_number=?, ifsc_code=?, account_holder=? WHERE id=?'
    );
    $stmt->bind_param('sssssssi', $name, $phone, $upi_id, $bank_name, $account_number, $ifsc_code, $account_holder, $user['id']);
    $stmt->execute();

    // Fetch the role from database
    $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $roleRow = $stmt->get_result()->fetch_assoc();
    $userRole = $roleRow['role'] ?? 'user';

    echo json_encode(['success' => true, 'user' => [
        'id'             => $user['id'],
        'name'           => $name,
        'email'          => $user['email'],
        'phone'          => $phone,
        'upi_id'         => $upi_id,
        'bank_name'      => $bank_name,
        'account_number' => $account_number,
        'ifsc_code'      => $ifsc_code,
        'account_holder' => $account_holder,
        'role'           => $userRole,
    ]]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);

// ── Helper ────────────────────────────────────────────────────────────────────
function makeToken(int $id, string $email): string {
    return base64_encode(json_encode(['id' => $id, 'email' => $email, 'exp' => time() + 86400 * 7]));
}
