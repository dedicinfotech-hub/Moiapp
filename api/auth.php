<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/mail.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper: check if a column exists in a table
function columnExists(mysqli $db, string $table, string $column): bool {
    $result = $db->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $result && $result->num_rows > 0;
}

// Helper: safe login log insert (ignores if table/column missing)
function safeLoginLog(mysqli $db, ?int $userId, ?string $email, ?string $ipAddress, ?string $userAgent, string $status, ?string $role = null): void {
    try {
        $tableExists = $db->query("SHOW TABLES LIKE 'login_logs'")->num_rows > 0;
        if (!$tableExists) {
            return; // Table doesn't exist, skip logging
        }

        $hasRole = columnExists($db, 'login_logs', 'role');
        if ($hasRole && $role !== null) {
            $stmt = $db->prepare('INSERT INTO login_logs (user_id, email, role, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?)');
            if ($stmt) {
                $stmt->bind_param('isssss', $userId, $email, $role, $ipAddress, $userAgent, $status);
                $stmt->execute();
            }
        } else {
            $stmt = $db->prepare('INSERT INTO login_logs (user_id, email, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)');
            if ($stmt) {
                $stmt->bind_param('issss', $userId, $email, $ipAddress, $userAgent, $status);
                $stmt->execute();
            }
        }
    } catch (Exception $e) {
        // Logging is non-critical; ignore errors
    }
}

// ── OTP Helper Functions ─────────────────────────────────────────────────────
function generateOTP(): string {
    return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

function sendOTP($phone, $otp) {
    // Get Twilio credentials from environment
    $accountSid = env('TWILIO_ACCOUNT_SID', '');
    $authToken = env('TWILIO_AUTH_TOKEN', '');
    $fromNumber = env('TWILIO_FROM_NUMBER', '');
    
    // If Twilio credentials are not configured, fall back to logging (for development)
    if (!$accountSid || !$authToken || !$fromNumber) {
        error_log("OTP for $phone: $otp (Twilio not configured)");
        return true;
    }
    
    // Send SMS via Twilio API using file_get_contents
    $url = "https://api.twilio.com/2010-04-01/Accounts/$accountSid/Messages.json";
    $data = http_build_query([
        'From' => $fromNumber,
        'To' => '+91' . $phone,
        'Body' => "Your MoiApp verification code is: $otp"
    ]);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Authorization: Basic ' . base64_encode("$accountSid:$authToken"),
                'Content-Type: application/x-www-form-urlencoded'
            ],
            'content' => $data
        ]
    ]);
    
    try {
        $response = file_get_contents($url, false, $context);
        return true;
    } catch (Exception $e) {
        error_log("Twilio SMS failed: " . $e->getMessage());
        return false;
    }
}

// ── Send OTP ──────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'send-otp') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $phone = trim($data['phone'] ?? '');
    
    // Validate 10-digit phone number
    if (!preg_match('/^[0-9]{10}$/', $phone)) {
        http_response_code(400);
        echo json_encode(['error' => 'Phone number must be 10 digits']);
        exit;
    }
    
    $db = getDB();
    
    // Check for OTP blocking (3 wrong attempts = 10 min block)
    $stmt = $db->prepare('SELECT id, otp_attempts, otp_blocked_until FROM users WHERE phone = ?');
    $stmt->bind_param('s', $phone);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if ($user && $user['otp_blocked_until'] && strtotime($user['otp_blocked_until']) > time()) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many failed attempts. Please try again later.']);
        exit;
    }
    
    $otp = generateOTP();
    $otpExpires = date('Y-m-d H:i:s', strtotime('+5 minutes'));
    
    if ($user) {
        // Update existing user's OTP
        $stmt = $db->prepare('UPDATE users SET otp_code = ?, otp_expires = ?, otp_attempts = 0, otp_blocked_until = NULL WHERE phone = ?');
        $stmt->bind_param('sss', $otp, $otpExpires, $phone);
        $stmt->execute();
    } else {
        // Create new user with phone (will need profile setup)
        $stmt = $db->prepare('INSERT INTO users (phone, otp_code, otp_expires, otp_attempts) VALUES (?, ?, ?, 0)');
        $stmt->bind_param('sss', $phone, $otp, $otpExpires);
        $stmt->execute();
    }
    
    sendOTP($phone, $otp);
    
    echo json_encode(['success' => true, 'message' => 'OTP sent successfully']);
    exit;
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'verify-otp') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $phone = trim($data['phone'] ?? '');
    $otp   = trim($data['otp'] ?? '');
    
    if (!preg_match('/^[0-9]{10}$/', $phone) || !preg_match('/^[0-9]{6}$/', $otp)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid phone or OTP format']);
        exit;
    }
    
    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, email, role, otp_code, otp_expires, otp_attempts, otp_blocked_until FROM users WHERE phone = ?');
    $stmt->bind_param('s', $phone);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found. Please register first.']);
        exit;
    }
    
    // Check if blocked
    if ($user['otp_blocked_until'] && strtotime($user['otp_blocked_until']) > time()) {
        http_response_code(429);
        echo json_encode(['error' => 'Account blocked. Try again later.']);
        exit;
    }
    
    // Check OTP expiration
    if (strtotime($user['otp_expires']) < time()) {
        http_response_code(401);
        echo json_encode(['error' => 'OTP expired. Request a new one.']);
        exit;
    }
    
    // Verify OTP
    if ($user['otp_code'] !== $otp) {
        $newAttempts = $user['otp_attempts'] + 1;
        if ($newAttempts >= 3) {
            $blockedUntil = date('Y-m-d H:i:s', strtotime('+10 minutes'));
            $stmt = $db->prepare('UPDATE users SET otp_attempts = ?, otp_blocked_until = ? WHERE id = ?');
            $stmt->bind_param('ssi', $newAttempts, $blockedUntil, $user['id']);
        } else {
            $stmt = $db->prepare('UPDATE users SET otp_attempts = ? WHERE id = ?');
            $stmt->bind_param('si', $newAttempts, $user['id']);
        }
        $stmt->execute();
        
        http_response_code(401);
        echo json_encode(['error' => 'Invalid OTP. ' . (3 - $newAttempts) . ' attempts remaining.']);
        exit;
    }
    
    // Clear OTP after successful verification
    $stmt = $db->prepare('UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_attempts = 0, otp_blocked_until = NULL WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    
    $token = makeToken($user['id'], $user['email'] ?? $phone);
    $needsProfile = empty($user['name']);
    
    echo json_encode([
        'success' => true, 
        'token' => $token, 
        'user' => [
            'id' => $user['id'], 
            'name' => $user['name'] ?? '', 
            'email' => $user['email'] ?? '', 
            'phone' => $phone,
            'role' => $user['role'] ?? 'user'
        ],
        'needsProfile' => $needsProfile
    ]);
    exit;
}

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
    $otp   = trim($data['otp'] ?? '');

    if (!$email || !$pass) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        exit;
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, password, role, login_attempts, login_blocked_until FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

    if (!$user || !password_verify($pass, $user['password'])) {
        // Track failed login attempts
        if ($user) {
            $newAttempts = ($user['login_attempts'] ?? 0) + 1;
            if ($newAttempts >= 3) {
                $blockedUntil = date('Y-m-d H:i:s', strtotime('+1 hour'));
                $stmt = $db->prepare('UPDATE users SET login_attempts = ?, login_blocked_until = ? WHERE id = ?');
                $stmt->bind_param('isi', $newAttempts, $blockedUntil, $user['id']);
            } else {
                $stmt = $db->prepare('UPDATE users SET login_attempts = ? WHERE id = ?');
                $stmt->bind_param('ii', $newAttempts, $user['id']);
            }
            $stmt->execute();
        }
        // Log failed login
        $logRole = $user['role'] ?? 'unknown';
        $logUserId = $user['id'] ?? null;
        safeLoginLog($db, $logUserId, $email, $ipAddress, $userAgent, 'failed', $logRole);
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }

    // Check if blocked
    if ($user['login_blocked_until'] && strtotime($user['login_blocked_until']) > time()) {
        // Log blocked attempt
        safeLoginLog($db, $user['id'], $email, $ipAddress, $userAgent, 'blocked', $user['role'] ?? 'user');
        http_response_code(429);
        echo json_encode(['error' => 'Account locked. Try again later.']);
        exit;
    }

    // For admin users, require OTP (disabled until SMTP is configured)
    if (false && $user['role'] === 'admin') {
        if (!$otp) {
            // Generate and send OTP
            $adminOtp = generateOTP();
            $otpExpires = date('Y-m-d H:i:s', strtotime('+5 minutes'));
            $stmt = $db->prepare('UPDATE users SET admin_otp = ?, admin_otp_expires = ?, login_attempts = 0, login_blocked_until = NULL WHERE id = ?');
            $stmt->bind_param('ssi', $adminOtp, $otpExpires, $user['id']);
            $stmt->execute();

            // Send OTP email
            $mailSent = sendOTPEmail($email, $user['name'], $adminOtp);
            if (!$mailSent) {
                error_log("Admin OTP for $email: $adminOtp (mail not sent - check mail config)");
            }

            // TEMPORARY: Return OTP in response for dev/testing (remove once real email works)
            echo json_encode(['success' => true, 'requires_otp' => true, 'message' => 'OTP sent to admin email', 'dev_otp' => $adminOtp]);
            exit;
        }
        
        // Verify admin OTP
        $stmt = $db->prepare('SELECT admin_otp, admin_otp_expires FROM users WHERE id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $otpRow = $stmt->get_result()->fetch_assoc();
        
        if (!$otpRow || $otpRow['admin_otp'] !== $otp || strtotime($otpRow['admin_otp_expires']) < time()) {
            // Log failed OTP attempt
            safeLoginLog($db, $user['id'], $email, $ipAddress, $userAgent, 'failed', $user['role'] ?? 'user');
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired OTP']);
            exit;
        }
        
        // Clear OTP after successful verification
        $stmt = $db->prepare('UPDATE users SET admin_otp = NULL, admin_otp_expires = NULL, login_attempts = 0, login_blocked_until = NULL WHERE id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
    } else {
        // Reset login attempts for non-admin users
        $stmt = $db->prepare('UPDATE users SET login_attempts = 0, login_blocked_until = NULL WHERE id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
    }

    // Log successful login
    safeLoginLog($db, $user['id'], $email, $ipAddress, $userAgent, 'success', $user['role'] ?? 'user');

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
    $city           = trim($data['city']           ?? '');
    $language       = trim($data['language']       ?? '');
    $upi_id         = trim($data['upi_id']         ?? '');
    $bank_name      = trim($data['bank_name']      ?? '');
    $account_number = trim($data['account_number'] ?? '');
    $ifsc_code      = trim($data['ifsc_code']      ?? '');
    $account_holder = trim($data['account_holder'] ?? '');

    if (!$name) { http_response_code(400); echo json_encode(['error' => 'Name is required']); exit; }

    $db   = getDB();
    $stmt = $db->prepare(
        'UPDATE users SET name=?, phone=?, city=?, language=?, upi_id=?, bank_name=?, account_number=?, ifsc_code=?, account_holder=? WHERE id=?'
    );
    $stmt->bind_param('sssssssssi', $name, $phone, $city, $language, $upi_id, $bank_name, $account_number, $ifsc_code, $account_holder, $user['id']);
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
        'city'           => $city,
        'language'       => $language,
        'upi_id'         => $upi_id,
        'bank_name'      => $bank_name,
        'account_number' => $account_number,
        'ifsc_code'      => $ifsc_code,
        'account_holder' => $account_holder,
        'role'           => $userRole,
    ]]);
    exit;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function makeToken(int $id, string $email): string {
    return base64_encode(json_encode(['id' => $id, 'email' => $email, 'exp' => time() + 86400 * 7]));
}

// ── Forgot Password ─────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'forgot-password') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email'] ?? '');

    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, name FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        // Don't reveal if email exists or not
        echo json_encode(['success' => true, 'message' => 'If the email exists, a reset link has been sent']);
        exit;
    }

    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $stmt = $db->prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $email, $token, $expires);
    $stmt->execute();

    // In production, send email with reset link
    // For now, we'll log it
    $resetLink = (env('APP_URL', 'http://localhost:8888/MoiApp') . '/reset-password?token=' . $token);
    error_log("Password reset link for $email: $resetLink");

    echo json_encode(['success' => true, 'message' => 'If the email exists, a reset link has been sent']);
    exit;
}

// ── Reset Password ───────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'reset-password') {
    $data = json_decode(file_get_contents('php://input'), true);
    $token = trim($data['token'] ?? '');
    $password = $data['password'] ?? '';

    if (!$token || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password are required']);
        exit;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT email, expires_at FROM password_resets WHERE token = ?');
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $reset = $stmt->get_result()->fetch_assoc();

    if (!$reset) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    if (strtotime($reset['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['error' => 'Token has expired']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('UPDATE users SET password = ? WHERE email = ?');
    $stmt->bind_param('ss', $hash, $reset['email']);
    $stmt->execute();

    // Delete used token
    $stmt = $db->prepare('DELETE FROM password_resets WHERE token = ?');
    $stmt->bind_param('s', $token);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
    exit;
}

// ── Delete Account (with 30-day grace period) ──────────────────────────────────
if ($method === 'DELETE' && $action === 'account') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db = getDB();

    // Check if already deleted
    $stmt = $db->prepare('SELECT deleted_at FROM users WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if ($row && $row['deleted_at']) {
        http_response_code(400);
        echo json_encode(['error' => 'Account is already scheduled for deletion']);
        exit;
    }

    // Set deleted_at to now (30-day grace period)
    $stmt = $db->prepare('UPDATE users SET deleted_at = NOW() WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    // Invalidate token by clearing it from localStorage on frontend
    echo json_encode([
        'success' => true,
        'message' => 'Account scheduled for deletion. You have 30 days to restore it by logging in again.',
        'grace_period_days' => 30
    ]);
    exit;
}

// ── Restore Account (within grace period) ──────────────────────────────────────
if ($method === 'POST' && $action === 'restore-account') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        exit;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, password, deleted_at FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    if (!$user['deleted_at']) {
        http_response_code(400);
        echo json_encode(['error' => 'Account is not scheduled for deletion']);
        exit;
    }

    // Check if within 30-day grace period
    $deletedAt = strtotime($user['deleted_at']);
    $gracePeriod = 30 * 24 * 60 * 60; // 30 days in seconds
    if (time() - $deletedAt > $gracePeriod) {
        http_response_code(400);
        echo json_encode(['error' => 'Grace period has expired. Account cannot be restored.']);
        exit;
    }

    // Restore account
    $stmt = $db->prepare('UPDATE users SET deleted_at = NULL WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    $token = makeToken($user['id'], $email);
    echo json_encode([
        'success' => true,
        'message' => 'Account restored successfully',
        'token' => $token,
        'user' => ['id' => $user['id'], 'email' => $email]
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
