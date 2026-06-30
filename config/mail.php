<?php
/**
 * Mail helper — sends OTP and notification emails.
 *
 * Uses PHP mail() by default. For better deliverability, configure SMTP
 * settings in your .env file and use a library like PHPMailer.
 */

require_once __DIR__ . '/env.php';

function isMailConfigured(): bool {
    $config = getMailConfig();
    return !empty($config['smtp_host']) && !empty($config['smtp_user']) && !empty($config['smtp_pass']);
}

function getMailConfig(): array {
    return [
        'from_email' => getenv('MAIL_FROM_EMAIL') ?: 'noreply@moiapp.com',
        'from_name'  => getenv('MAIL_FROM_NAME')  ?: 'MoiApp',
        'smtp_host'  => getenv('MAIL_SMTP_HOST')  ?: '',
        'smtp_port'  => getenv('MAIL_SMTP_PORT')  ?: '587',
        'smtp_user'  => getenv('MAIL_SMTP_USER')  ?: '',
        'smtp_pass'  => getenv('MAIL_SMTP_PASS')  ?: '',
        'smtp_secure' => getenv('MAIL_SMTP_SECURE') ?: 'tls',
    ];
}

function mail_from_matches_smtp_user(): bool
{
    $config = getMailConfig();
    return strtolower($config['from_email']) === strtolower($config['smtp_user']);
}

/**
 * Test SMTP login without sending mail.
 */
function probe_smtp_connection(): array
{
    if (!isMailConfigured()) {
        return ['configured' => false];
    }

    $config = getMailConfig();
    $result = [
        'configured' => true,
        'phpmailer' => class_exists('PHPMailer\\PHPMailer\\PHPMailer'),
        'from_email' => $config['from_email'],
        'from_matches_smtp_user' => mail_from_matches_smtp_user(),
    ];

    if (!$result['phpmailer']) {
        $result['connected'] = false;
        $result['hint'] = 'PHPMailer not installed — run composer install on server.';
        return $result;
    }

    if (!$result['from_matches_smtp_user']) {
        $result['hint'] = 'MAIL_FROM_EMAIL must match MAIL_SMTP_USER on Hostinger (same mailbox address).';
    }

    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = $config['smtp_secure'];
        $mail->Port       = (int)$config['smtp_port'];
        $mail->Timeout    = 10;

        $connected = $mail->smtpConnect();
        if ($connected) {
            $mail->smtpClose();
        }

        $result['connected'] = $connected;
        if (!$connected) {
            $result['hint'] = 'SMTP connection failed — check MAIL_SMTP_* credentials in .env.';
        } elseif (!$result['from_matches_smtp_user']) {
            $result['hint'] = 'SMTP OK but MAIL_FROM_EMAIL ≠ MAIL_SMTP_USER — emails may be rejected or go to spam.';
        } else {
            $result['hint'] = 'SMTP connection OK. If admin OTP not received, check spam/junk folder.';
        }
    } catch (\Exception $e) {
        $result['connected'] = false;
        $result['error'] = $e->getMessage();
        $result['hint'] = 'SMTP error — verify Hostinger mailbox password and port (587 tls or 465 ssl).';
    }

    return $result;
}

function mask_email(string $email): string
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return $email;
    }

    [$local, $domain] = explode('@', $email, 2);
    if (strlen($local) <= 2) {
        $maskedLocal = substr($local, 0, 1) . '***';
    } else {
        $maskedLocal = substr($local, 0, 1) . str_repeat('*', max(1, strlen($local) - 2)) . substr($local, -1);
    }

    return $maskedLocal . '@' . $domain;
}

function encode_mail_subject(string $subject): string
{
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");
    }

    return $subject;
}

function sendMail(string $to, string $subject, string $body, string $toName = ''): bool {
    $config = getMailConfig();
    $fromEmail = $config['from_email'];
    $fromName  = $config['from_name'];

    // If SMTP is configured, try to use PHPMailer if available
    if (!empty($config['smtp_host']) && !empty($config['smtp_user'])) {
        if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            return sendMailSMTP($to, $toName, $subject, $body, $config);
        }
    }

    // Fallback to PHP mail()
    $headers = [];
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "Reply-To: {$fromEmail}";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/html; charset=UTF-8";

    $toHeader = $toName ? "{$toName} <{$to}>" : $to;

    return mail($toHeader, encode_mail_subject($subject), $body, implode("\r\n", $headers));
}

function sendMailSMTP(string $to, string $toName, string $subject, string $body, array $config): bool {
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = $config['smtp_secure'];
        $mail->Port       = (int)$config['smtp_port'];

        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        $mail->setFrom($config['from_email'], $config['from_name']);
        $mail->addAddress($to, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (\Exception $e) {
        error_log("Mail error: " . $e->getMessage());
        return false;
    }
}

function sendOTPEmail(string $to, string $toName, string $otp): bool {
    return sendOtpEmailMessage($to, $toName, $otp, 'Your MoiApp OTP Code', 'Your OTP code is:');
}

function sendAdminOTPEmail(string $to, string $toName, string $otp): bool
{
    return sendOtpEmailMessage(
        $to,
        $toName,
        $otp,
        'MoiApp Admin Login — OTP Code',
        'Your admin login verification code is:'
    );
}

function sendOtpEmailMessage(string $to, string $toName, string $otp, string $subject, string $intro): bool
{
    $safeName = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');
    $body = "
        <html>
        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: #FFC107; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;'>
                <h1 style='color: #000; margin: 0;'>MoiApp</h1>
            </div>
            <div style='background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;'>
                <p style='color: #333; font-size: 16px;'>Hello {$safeName},</p>
                <p style='color: #333; font-size: 16px;'>{$intro}</p>
                <div style='background: #fff; border: 2px solid #FFC107; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;'>
                    <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;'>{$otp}</span>
                </div>
                <p style='color: #666; font-size: 14px;'>This code expires in 5 minutes.</p>
                <p style='color: #666; font-size: 14px;'>If you didn't request this, please ignore this email.</p>
            </div>
        </body>
        </html>
    ";

    return sendMail($to, $subject, $body, $toName);
}

function sendPasswordResetEmail(string $to, string $toName, string $resetLink): bool {
    $subject = 'Reset your MoiApp password';
    $body = "
        <html>
        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: #FFC107; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;'>
                <h1 style='color: #000; margin: 0;'>MoiApp</h1>
            </div>
            <div style='background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;'>
                <p style='color: #333; font-size: 16px;'>Hello " . htmlspecialchars($toName) . ",</p>
                <p style='color: #333; font-size: 16px;'>We received a request to reset your password. Click the button below — this link expires in 1 hour.</p>
                <p style='text-align: center; margin: 28px 0;'>
                    <a href='" . htmlspecialchars($resetLink) . "' style='background: #FFC107; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;'>Reset Password</a>
                </p>
                <p style='color: #666; font-size: 13px; word-break: break-all;'>Or copy this link: " . htmlspecialchars($resetLink) . "</p>
                <p style='color: #666; font-size: 14px;'>If you didn't request this, you can safely ignore this email.</p>
            </div>
        </body>
        </html>
    ";

    return sendMail($to, $subject, $body, $toName);
}
