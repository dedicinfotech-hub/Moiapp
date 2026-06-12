<?php
/**
 * Mail helper — sends OTP and notification emails.
 *
 * Uses PHP mail() by default. For better deliverability, configure SMTP
 * settings in your .env file and use a library like PHPMailer.
 */

require_once __DIR__ . '/env.php';

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

function sendMail(string $to, string $subject, string $body, string $toName = ''): bool {
    $config = getMailConfig();
    $fromEmail = $config['from_email'];
    $fromName  = $config['from_name'];

    // If SMTP is configured, try to use PHPMailer if available
    if (!empty($config['smtp_host']) && class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        return sendMailSMTP($to, $toName, $subject, $body, $config);
    }

    // Fallback to PHP mail()
    $headers = [];
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "Reply-To: {$fromEmail}";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/html; charset=UTF-8";

    $toHeader = $toName ? "{$toName} <{$to}>" : $to;

    return mail($toHeader, $subject, $body, implode("\r\n", $headers));
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

        $mail->setFrom($config['from_email'], $config['from_name']);
        $mail->addAddress($to, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Mail error: " . $e->getMessage());
        return false;
    }
}

function sendOTPEmail(string $to, string $toName, string $otp): bool {
    $subject = 'Your MoiApp OTP Code';
    $body = "
        <html>
        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: #FFC107; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;'>
                <h1 style='color: #000; margin: 0;'>MoiApp</h1>
            </div>
            <div style='background: #fafafa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;'>
                <p style='color: #333; font-size: 16px;'>Hello {$toName},</p>
                <p style='color: #333; font-size: 16px;'>Your OTP code is:</p>
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
