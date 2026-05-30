<?php
/**
 * bootstrap.php — include this at the top of every API file.
 * Guarantees JSON error output even on fatal errors, and loads env + db.
 */

// Always output JSON, never HTML error pages
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Catch fatal errors and return JSON instead of blank 500
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
        }
        echo json_encode([
            'error'   => 'Server error',
            'detail'  => $err['message'],
            'file'    => basename($err['file']),
            'line'    => $err['line'],
        ]);
    }
});

// Use __DIR__ so paths work regardless of cwd or symlinks
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_helper.php';
