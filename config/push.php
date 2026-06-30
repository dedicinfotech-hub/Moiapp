<?php
/**
 * Expo Push Notification helpers
 */

function sendExpoPushMessages(array $messages): void
{
    if (empty($messages)) {
        return;
    }

    $chunks = array_chunk($messages, 100);
    foreach ($chunks as $chunk) {
        $payload = json_encode($chunk);
        if ($payload === false) {
            continue;
        }

        $ch = curl_init('https://exp.host/--/api/v2/push/send');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Accept-Encoding: gzip, deflate',
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

function sendExpoPushToUser(mysqli $db, int $userId, string $title, string $body, string $type = 'general', ?int $eventId = null): void
{
    $tableExists = $db->query("SHOW TABLES LIKE 'device_push_tokens'")->num_rows > 0;
    if (!$tableExists) {
        return;
    }

    $stmt = $db->prepare('SELECT expo_push_token FROM device_push_tokens WHERE user_id = ? AND is_active = 1');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    if (!$rows) {
        return;
    }

    $messages = [];
    foreach ($rows as $row) {
        $token = trim($row['expo_push_token'] ?? '');
        if ($token === '' || !str_starts_with($token, 'ExponentPushToken')) {
            continue;
        }
        $messages[] = [
            'to' => $token,
            'title' => $title,
            'body' => $body,
            'sound' => 'default',
            'data' => [
                'type' => $type,
                'event_id' => $eventId,
            ],
        ];
    }

    sendExpoPushMessages($messages);
}
