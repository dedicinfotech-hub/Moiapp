<?php
require_once __DIR__ . '/env.php';

// Allowed origins — supports multiple comma-separated values in CORS_ORIGIN
// e.g. CORS_ORIGIN=https://dsitesai.com,https://www.dsitesai.com
$allowedOrigins = array_map('trim', explode(',', env('CORS_ORIGIN', 'http://localhost:3000')));

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($requestOrigin === '') {
    // Same-origin request (no Origin header) — always allow
    $originHeader = $allowedOrigins[0];
} elseif (in_array($requestOrigin, $allowedOrigins, true)) {
    // Exact match
    $originHeader = $requestOrigin;
} else {
    // Unknown origin — still send the primary allowed origin so PHP runs,
    // but the browser will block it (correct CORS behaviour)
    $originHeader = $allowedOrigins[0];
}

header("Access-Control-Allow-Origin: {$originHeader}");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
