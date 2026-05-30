<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

// Quick health check — visit https://dsitesai.com/moiapp/api/ping.php
// to verify PHP, DB connection, and env loading all work.

$db_ok  = false;
$db_err = '';
try {
    $db    = getDB();
    $db_ok = true;
} catch (Throwable $e) {
    $db_err = $e->getMessage();
}

echo json_encode([
    'status'     => $db_ok ? 'ok' : 'error',
    'php'        => PHP_VERSION,
    'db'         => $db_ok ? 'connected' : 'failed: ' . $db_err,
    'app_url'    => env('APP_URL', '(not set)'),
    'cors'       => env('CORS_ORIGIN', '(not set)'),
    'time'       => date('Y-m-d H:i:s'),
]);
