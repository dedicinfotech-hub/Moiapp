<?php
/**
 * Auth helper — MAMP's Apache strips the Authorization header.
 * We use X-Auth-Token instead, with Authorization as fallback.
 *
 * Tokens are base64 JSON payloads with a server-side session (jti).
 * Logout revokes the session so the token cannot be reused.
 */

function getRequestToken(): ?string {
    $token = null;

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strtolower($k) === 'x-auth-token') { $token = $v; break; }
        }
        if (!$token) {
            foreach ($headers as $k => $v) {
                if (strtolower($k) === 'authorization') { $token = $v; break; }
            }
        }
    }

    if (!$token) {
        $token = $_SERVER['HTTP_X_AUTH_TOKEN']
              ?? $_SERVER['HTTP_AUTHORIZATION']
              ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
              ?? null;
    }

    if (!$token) return null;
    if (str_starts_with($token, 'Bearer ')) $token = substr($token, 7);
    return $token;
}

function authSessionsTableExists(mysqli $db): bool {
    static $exists = null;
    if ($exists !== null) return $exists;
    $exists = $db->query("SHOW TABLES LIKE 'auth_sessions'")->num_rows > 0;
    return $exists;
}

function registerAuthSession(int $userId, string $jti, int $expiresAt): void {
    try {
        $db = getDB();
        if (!authSessionsTableExists($db)) return;

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $expires = date('Y-m-d H:i:s', $expiresAt);

        $stmt = $db->prepare(
            'INSERT INTO auth_sessions (user_id, jti, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)'
        );
        if (!$stmt) return;
        $stmt->bind_param('issss', $userId, $jti, $ip, $ua, $expires);
        $stmt->execute();
    } catch (Exception $e) {
        // Non-critical
    }
}

function isAuthSessionActive(string $jti): bool {
    try {
        $db = getDB();
        if (!authSessionsTableExists($db)) return true;

        $stmt = $db->prepare(
            'SELECT revoked_at, expires_at FROM auth_sessions WHERE jti = ? LIMIT 1'
        );
        if (!$stmt) return false;
        $stmt->bind_param('s', $jti);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) return false;
        if ($row['revoked_at']) return false;
        if (strtotime($row['expires_at']) < time()) return false;
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function revokeAuthSession(string $jti): void {
    try {
        $db = getDB();
        if (!authSessionsTableExists($db)) return;

        $stmt = $db->prepare(
            'UPDATE auth_sessions SET revoked_at = NOW() WHERE jti = ? AND revoked_at IS NULL'
        );
        if (!$stmt) return;
        $stmt->bind_param('s', $jti);
        $stmt->execute();
    } catch (Exception $e) {
        // Non-critical
    }
}

function makeToken(int $id, string $email, ?string $role = null): string {
    $jti = bin2hex(random_bytes(16));
    $exp = time() + 86400 * 7;
    $payload = [
        'id'    => $id,
        'email' => $email,
        'jti'   => $jti,
        'exp'   => $exp,
    ];
    if ($role !== null) {
        $payload['role'] = $role;
    }

    registerAuthSession($id, $jti, $exp);
    return base64_encode(json_encode($payload));
}

function getAuthUser(): ?array {
    $token = getRequestToken();
    if (!$token) return null;

    $payload = json_decode(base64_decode($token), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;

    if (!empty($payload['jti']) && !isAuthSessionActive($payload['jti'])) {
        return null;
    }

    if (isset($payload['id'])) {
        $db = getDB();
        $checkColumn = $db->query("SHOW COLUMNS FROM users LIKE 'deleted_at'");
        if ($checkColumn && $checkColumn->num_rows > 0) {
            $stmt = $db->prepare('SELECT deleted_at FROM users WHERE id = ?');
            $stmt->bind_param('i', $payload['id']);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row && $row['deleted_at']) {
                return null;
            }
        }
    }

    return $payload;
}
