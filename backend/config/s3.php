<?php
require_once __DIR__ . '/env.php';

define('AWS_ACCESS_KEY', env('AWS_ACCESS_KEY'));
define('AWS_SECRET_KEY', env('AWS_SECRET_KEY'));
define('AWS_REGION',     env('AWS_REGION',  'ap-south-1'));
define('AWS_BUCKET',     env('AWS_BUCKET',  'moiapp-photos'));
define('AWS_BASE_URL',   'https://' . AWS_BUCKET . '.s3.' . AWS_REGION . '.amazonaws.com');

/**
 * Upload a file to S3 using AWS Signature V4 (no SDK needed).
 */
function uploadToS3(string $filePath, string $originalName, string $mimeType): array {
    $date      = gmdate('Ymd');
    $dateTime  = gmdate('Ymd\THis\Z');
    $ext       = pathinfo($originalName, PATHINFO_EXTENSION);
    $key       = 'photos/' . date('Y/m') . '/' . uniqid() . '.' . $ext;
    $host      = AWS_BUCKET . '.s3.' . AWS_REGION . '.amazonaws.com';
    $url       = 'https://' . $host . '/' . $key;

    $fileContent = file_get_contents($filePath);
    $payloadHash = hash('sha256', $fileContent);

    $canonicalHeaders = "content-type:{$mimeType}\nhost:{$host}\nx-amz-content-sha256:{$payloadHash}\nx-amz-date:{$dateTime}\n";
    $signedHeaders    = 'content-type;host;x-amz-content-sha256;x-amz-date';
    $canonicalRequest = "PUT\n/{$key}\n\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";

    $credentialScope = "{$date}/" . AWS_REGION . "/s3/aws4_request";
    $stringToSign    = "AWS4-HMAC-SHA256\n{$dateTime}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

    $signingKey = hash_hmac('sha256', 'aws4_request',
        hash_hmac('sha256', 's3',
            hash_hmac('sha256', AWS_REGION,
                hash_hmac('sha256', $date, 'AWS4' . AWS_SECRET_KEY, true),
            true), true), true);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);

    $authHeader = "AWS4-HMAC-SHA256 Credential=" . AWS_ACCESS_KEY . "/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => 'PUT',
        CURLOPT_POSTFIELDS     => $fileContent,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "Content-Type: {$mimeType}",
            "Host: {$host}",
            "x-amz-content-sha256: {$payloadHash}",
            "x-amz-date: {$dateTime}",
            "Authorization: {$authHeader}",
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new RuntimeException('S3 upload failed (' . $httpCode . '): ' . $response);
    }

    return ['key' => $key, 'url' => $url];
}
