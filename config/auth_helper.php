<?php
/**
 * Auth helper — MAMP's Apache strips the Authorization header.
 * We use X-Auth-Token instead, with Authorization as fallback.
 */
function getAuthUser(): ?array {
    $token = null;

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        // Primary: X-Auth-Token (works in MAMP)
        foreach ($headers as $k => $v) {
            if (strtolower($k) === 'x-auth-token') { $token = $v; break; }
        }
        // Fallback: Authorization (works in production)
        if (!$token) {
            foreach ($headers as $k => $v) {
                if (strtolower($k) === 'authorization') { $token = $v; break; }
            }
        }
    }

    // $_SERVER fallbacks
    if (!$token) {
        $token = $_SERVER['HTTP_X_AUTH_TOKEN']
              ?? $_SERVER['HTTP_AUTHORIZATION']
              ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
              ?? null;
    }

    if (!$token) return null;

    // Strip "Bearer " prefix if present
    if (str_starts_with($token, 'Bearer ')) $token = substr($token, 7);

    $payload = json_decode(base64_decode($token), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;

    return $payload;
}
