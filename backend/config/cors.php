<?php
require_once __DIR__ . '/env.php';

// Allowed origins — supports multiple comma-separated values in CORS_ORIGIN
// e.g. CORS_ORIGIN=https://moipassbook.com,https://www.moipassbook.com
$allowedOrigins = array_map('trim', explode(',', env('CORS_ORIGIN', 'http://localhost:3000')));

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';

// Debug logging for CORS troubleshooting
if ($requestMethod === 'OPTIONS' || $requestOrigin !== '') {
    error_log("[CORS_DEBUG] Origin: {$requestOrigin}, Method: {$requestMethod}, Allowed: " . implode(',', $allowedOrigins));
}

if ($requestOrigin === '') {
    // Same-origin request (no Origin header) — always allow
    $originHeader = $allowedOrigins[0];
} elseif (in_array($requestOrigin, $allowedOrigins, true)) {
    // Exact match
    $originHeader = $requestOrigin;
} else {
    // For debugging: allow localhost/capacitor origins dynamically
    // Remove this block in production if you want strict CORS
    $isLocalhost = stripos($requestOrigin, 'localhost') !== false;
    $isCapacitor = stripos($requestOrigin, 'capacitor') !== false;
    
    if ($isLocalhost || $isCapacitor) {
        $originHeader = $requestOrigin;
        error_log("[CORS_DEBUG] Allowing dynamic origin: {$requestOrigin}");
    } else {
        // Unknown origin — still send the primary allowed origin so PHP runs,
        // but the browser will block it (correct CORS behaviour)
        $originHeader = $allowedOrigins[0];
        error_log("[CORS_DEBUG] Blocking unknown origin: {$requestOrigin}");
    }
}

header("Access-Control-Allow-Origin: {$originHeader}");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
