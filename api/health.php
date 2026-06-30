<?php
/**
 * Public readiness check — reports whether mail/SMS are configured.
 * Does not expose secrets, send test messages, or leak OTP values.
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/sms.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$smsProvider = null;
if (!empty(env('MSG91_AUTH_KEY'))) {
    $smsProvider = 'msg91';
} elseif (!empty(env('TWILIO_ACCOUNT_SID')) && !empty(env('TWILIO_AUTH_TOKEN'))) {
    $smsProvider = 'twilio';
}

$mailConfigured = isMailConfigured();
$phpmailerReady = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
$devOtpFallback = env('DEV_OTP_FALLBACK', '0') === '1';

$projectRoot = dirname(__DIR__);
$autoloadPath = $projectRoot . '/vendor/autoload.php';
$autoloadExists = is_file($autoloadPath);
$vendorDirExists = is_dir($projectRoot . '/vendor');
$phpmailerFileExists = is_file($projectRoot . '/vendor/phpmailer/phpmailer/src/PHPMailer.php');

$otpReady = isSmsConfigured() || $mailConfigured || $devOtpFallback;

$includeOutboundIp = isset($_GET['outbound_ip']) && $_GET['outbound_ip'] === '1';
$includeMsg91Probe = isset($_GET['msg91_probe']) && $_GET['msg91_probe'] === '1';
$includeMailProbe = isset($_GET['mail_probe']) && $_GET['mail_probe'] === '1';

$outboundIp = $includeOutboundIp ? get_server_outbound_ip() : null;
$msg91Probe = $includeMsg91Probe && isSmsConfigured() && $smsProvider === 'msg91'
    ? probe_msg91_ip_security()
    : null;
$mailProbe = $includeMailProbe ? probe_smtp_connection() : null;

$response = [
    'ok' => true,
    'services' => [
        'mail' => [
            'configured' => $mailConfigured,
            'phpmailer' => $phpmailerReady,
            'smtp_ready' => $mailConfigured && $phpmailerReady,
            'from_matches_smtp_user' => $mailConfigured ? mail_from_matches_smtp_user() : null,
            'autoload_exists' => $autoloadExists,
            'vendor_dir_exists' => $vendorDirExists,
            'phpmailer_file_exists' => $phpmailerFileExists,
        ],
        'sms' => [
            'configured' => isSmsConfigured(),
            'provider' => $smsProvider,
            'outbound_ip' => $outboundIp,
        ],
        'otp' => [
            'delivery_ready' => $otpReady,
            'dev_fallback' => $devOtpFallback,
        ],
    ],
    'hints' => array_values(array_filter([
        !$mailConfigured ? 'Set MAIL_SMTP_* in config/.env (Hostinger: smtp.hostinger.com, port 587 tls or 465 ssl).' : null,
        $mailConfigured && !mail_from_matches_smtp_user()
            ? 'MAIL_FROM_EMAIL must match MAIL_SMTP_USER (same Hostinger mailbox) or admin OTP may not arrive.'
            : null,
        $mailConfigured && !$includeMailProbe
            ? 'Open /api/health.php?mail_probe=1 to test SMTP connection for admin email OTP.'
            : null,
        $mailConfigured && !$phpmailerReady && !$autoloadExists
            ? 'vendor/autoload.php not found at project root — upload vendor/ next to api/ and config/.'
            : null,
        $mailConfigured && !$phpmailerReady && $autoloadExists
            ? 'vendor exists but PHPMailer not loaded — re-upload config/bootstrap.php from the repo.'
            : null,
        $mailConfigured && !$phpmailerReady && $vendorDirExists && !$phpmailerFileExists
            ? 'vendor/ folder incomplete — upload full vendor/ from composer install (include phpmailer/).'
            : null,
        !isSmsConfigured() ? 'Set MSG91_AUTH_KEY (India) or Twilio for phone OTP via SMS.' : null,
        isSmsConfigured() && $smsProvider === 'msg91' && !$msg91Probe
            ? 'MSG91: open /api/health.php?msg91_probe=1 to test IP whitelist on your Authkey.'
            : null,
        ($msg91Probe['ip_security'] ?? null) === 'blocked'
            ? ($msg91Probe['hint'] ?? 'MSG91 IP still blocked (418).')
            : null,
        ($msg91Probe['ip_security'] ?? null) === 'passed'
            ? ($msg91Probe['hint'] ?? 'MSG91 IP whitelist OK — try Send OTP.')
            : null,
        $devOtpFallback ? 'DEV_OTP_FALLBACK=1 is on — disable before production.' : null,
    ])),
];

if ($outboundIp) {
    $response['msg91_whitelist'] = [
        'ip' => $outboundIp,
        'steps' => [
            'MSG91 panel → username dropdown → Authkey → verify with OTP',
            'Click the arrow under Actions on the Authkey used in MSG91_AUTH_KEY',
            'Under Whitelisted IPs for that Authkey, add the IP (or click + on Recent IPs)',
            'Company-level whitelist alone may not apply — must be on the Authkey',
            'Alternative: disable IP security toggle on that Authkey to unblock quickly',
            'SMS → Failed Logs shows the exact IP MSG91 saw — whitelist that IP if different',
        ],
    ];
}

if ($msg91Probe) {
    $response['msg91_probe'] = $msg91Probe;
}

if ($mailProbe) {
    $response['mail_probe'] = $mailProbe;
}

echo json_encode($response);
