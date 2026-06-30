<?php
/**
 * SMS helper — MSG91 or Twilio when configured in .env
 */
require_once __DIR__ . '/env.php';

function isSmsConfigured(): bool {
    return !empty(env('MSG91_AUTH_KEY')) || (!empty(env('TWILIO_ACCOUNT_SID')) && !empty(env('TWILIO_AUTH_TOKEN')) && !empty(env('TWILIO_FROM_NUMBER')));
}

function sendSMS(string $phone, string $message): bool {
    if (!empty(env('MSG91_AUTH_KEY'))) {
        return sendSMSMsg91($phone, $message);
    }
    if (!empty(env('TWILIO_ACCOUNT_SID')) && !empty(env('TWILIO_AUTH_TOKEN')) && !empty(env('TWILIO_FROM_NUMBER'))) {
        return sendSMSTwilio($phone, $message);
    }
    return false;
}

function get_server_outbound_ip(): ?string
{
    $ch = curl_init('https://api.ipify.org');
    if ($ch === false) {
        return null;
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $ip = trim((string)curl_exec($ch));
    curl_close($ch);

    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : null;
}

function msg91_probe_ip_passed(string $response): bool
{
    if (preg_match('/\b418\b/', $response)) {
        return false;
    }
    if (preg_match('/\b101\b/', $response)) {
        return true;
    }

    $lower = strtolower($response);
    return str_contains($lower, 'missing')
        && (str_contains($lower, 'mobile') || str_contains($lower, 'group_id'));
}

function msg91_send_succeeded(string $response, int $httpCode): bool
{
    $text = trim($response);
    if ($httpCode !== 200 || $text === '') {
        return false;
    }

    // MSG91 error codes are typically 3-digit numbers (101, 203, 418, etc.)
    if (preg_match('/^\d{3}$/', $text)) {
        return false;
    }

    $lower = strtolower($text);
    foreach (['error', 'missing', 'invalid', 'blacklist', 'banned', 'failed', 'disabled'] as $keyword) {
        if (str_contains($lower, $keyword)) {
            return false;
        }
    }

    return true;
}

/**
 * Dry-run MSG91 call (no SMS sent). If IP is whitelisted, MSG91 rejects missing mobile (not 418).
 */
function probe_msg91_ip_security(): array
{
    $authKey = env('MSG91_AUTH_KEY');
    if (!$authKey) {
        return ['configured' => false];
    }

    $url = 'https://api.msg91.com/api/sendhttp.php?' . http_build_query([
        'authkey' => $authKey,
        'mobiles' => '',
        'message' => 'probe',
        'sender'  => env('MSG91_SENDER_ID', 'MOIAPP'),
        'route'   => env('MSG91_ROUTE', '4'),
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response = trim((string)curl_exec($ch));
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $outboundIp = get_server_outbound_ip();

    if (preg_match('/\b418\b/', $response)) {
        return [
            'configured'     => true,
            'ip_security'    => 'blocked',
            'msg91_response' => '418',
            'outbound_ip'    => $outboundIp,
            'hint'           => 'MSG91 still rejects this server IP. Whitelist under the exact Authkey used in .env (Actions arrow), or click + on Recent IPs, or copy IP from SMS → Failed Logs.',
        ];
    }

    if (msg91_probe_ip_passed($response)) {
        return [
            'configured'     => true,
            'ip_security'    => 'passed',
            'msg91_response' => substr($response, 0, 80),
            'outbound_ip'    => $outboundIp,
            'hint'           => 'IP whitelist OK. Try Send OTP in the app. If SMS still fails, check DLT template / sender ID in MSG91 (errors 203, 211).',
        ];
    }

    return [
        'configured'     => true,
        'ip_security'    => 'unknown',
        'msg91_response' => substr($response, 0, 80),
        'outbound_ip'    => $outboundIp,
        'http_code'      => $httpCode,
        'hint'           => 'Unexpected MSG91 response — check MSG91 dashboard logs.',
    ];
}

function sendSMSMsg91(string $phone, string $message): bool {
    $authKey = env('MSG91_AUTH_KEY');
    $sender  = env('MSG91_SENDER_ID', 'MOIAPP');
    $mobile  = '91' . preg_replace('/\D/', '', $phone);

    $url = 'https://api.msg91.com/api/sendhttp.php?' . http_build_query([
        'authkey'   => $authKey,
        'mobiles'   => $mobile,
        'message'   => $message,
        'sender'    => $sender,
        'route'     => env('MSG91_ROUTE', '4'),
        'country'   => '91',
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("MSG91 curl error: $error");
        return false;
    }

    // MSG91 returns a message ID on success, or an error code / message
    $responseText = trim((string)$response);
    $ok = msg91_send_succeeded($responseText, (int)$httpCode);

    if (!$ok && preg_match('/\b418\b/', $responseText)) {
        $outboundIp = get_server_outbound_ip();
        $ipHint = $outboundIp ? " Whitelist this server IP in MSG91: {$outboundIp}" : ' Whitelist your Hostinger server IP in MSG91 dashboard.';
        error_log("MSG91 error 418 — IP not whitelisted.{$ipHint} Response: {$responseText}");
        return false;
    }

    if (!$ok) {
        error_log("MSG91 send failed ($httpCode): $responseText");
    }
    return $ok;
}

function sendSMSTwilio(string $phone, string $message): bool {
    $sid   = env('TWILIO_ACCOUNT_SID');
    $token = env('TWILIO_AUTH_TOKEN');
    $from  = env('TWILIO_FROM_NUMBER');
    $to    = '+91' . preg_replace('/\D/', '', $phone);

    $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
    $postFields = http_build_query(['To' => $to, 'From' => $from, 'Body' => $message]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_USERPWD        => "{$sid}:{$token}",
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("Twilio curl error: $error");
        return false;
    }

    $ok = $httpCode >= 200 && $httpCode < 300;
    if (!$ok) {
        error_log("Twilio send failed ($httpCode): $response");
    }
    return $ok;
}
