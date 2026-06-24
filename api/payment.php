<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

const PAYMENT_VALID_GIFT_TYPES = ['cash', 'gold', 'silver', 'gift'];
const PAYMENT_VALID_RELATIONS = ['family', 'friend', 'colleague', 'relative', 'neighbor', 'business', 'other'];
const PAYMENT_VALID_METHODS = ['upi', 'card', 'netbanking', 'wallet', 'scan', 'other'];

function payment_json_response(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function payment_error(string $message, int $status = 400, array $extra = []): void {
    payment_json_response(array_merge(['error' => $message], $extra), $status);
}

function payment_clean_string($value): string {
    return is_string($value) ? trim($value) : '';
}

function payment_nullable_string($value): ?string {
    $clean = payment_clean_string($value);
    return $clean === '' ? null : $clean;
}

function payment_normalize_enum($value, array $validValues, string $default): string {
    if (!is_string($value)) {
        return $default;
    }

    $normalized = strtolower(trim($value));
    return in_array($normalized, $validValues, true) ? $normalized : $default;
}

function payment_event_title(array $event): string {
    if (!empty($event['custom_title'])) {
        return $event['custom_title'];
    }
    if (!empty($event['bride_name']) && !empty($event['groom_name'])) {
        return $event['bride_name'] . ' & ' . $event['groom_name'];
    }
    if (!empty($event['birthday_person_name'])) {
        return $event['birthday_person_name'] . '\'s Birthday';
    }
    return $event['event_type'] ?? 'Moi Contribution';
}

function payment_guest_event(mysqli $db, string $guestToken): array {
    $stmt = $db->prepare(
        'SELECT e.id, e.user_id, e.slug, e.event_type, e.custom_title, e.bride_name, e.groom_name,
                e.birthday_person_name, e.wedding_date, e.city
         FROM events e
         WHERE e.guest_token = ?
           AND e.is_active = 1
           AND e.event_mode = \'new\'
           AND e.approval_status = \'approved\'
           AND e.qr_enabled = 1'
    );
    $stmt->bind_param('s', $guestToken);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();

    if (!$event) {
        payment_error('This payment link is invalid or has been closed by the host.', 403);
    }

    return $event;
}

function payment_public_event(mysqli $db, string $eventSlug): array {
    $stmt = $db->prepare(
        'SELECT e.id, e.user_id, e.slug, e.event_type, e.custom_title, e.bride_name, e.groom_name,
                e.birthday_person_name, e.wedding_date, e.city
         FROM events e
         WHERE e.slug = ?
           AND e.is_active = 1
           AND e.event_mode = \'new\'
           AND e.approval_status = \'approved\''
    );
    $stmt->bind_param('s', $eventSlug);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();

    if (!$event) {
        payment_error('This event is not available for online Moi payments.', 403);
    }

    return $event;
}

function payment_convenience_fee(float $amount): int {
    $calculated = (int) round($amount * 0.0018);
    return max(9, $calculated);
}

function payment_razorpay_secret(): string {
    $secret = env('RAZORPAY_KEY_SECRET', '');
    if ($secret === '') {
        payment_error('Razorpay is not configured. Please add RAZORPAY_KEY_SECRET.', 503);
    }
    return $secret;
}

function payment_razorpay_key(): string {
    $key = env('RAZORPAY_KEY_ID', '');
    if ($key === '') {
        payment_error('Razorpay is not configured. Please add RAZORPAY_KEY_ID.', 503);
    }
    return $key;
}

function payment_razorpay_request(string $method, string $path, ?array $payload = null): array {
    $key = payment_razorpay_key();
    $secret = payment_razorpay_secret();

    $url = 'https://api.razorpay.com/v1/' . ltrim($path, '/');
    $ch = curl_init($url);

    $headers = [
        'Authorization: Basic ' . base64_encode($key . ':' . $secret),
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
    ]);

    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        payment_error('Razorpay request failed: ' . $curlError, 502);
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        payment_error('Invalid Razorpay response.', 502);
    }

    if ($httpCode >= 300) {
        $message = $data['description'] ?? $data['error']['description'] ?? 'Razorpay request failed';
        payment_error($message, 502);
    }

    return $data;
}

function payment_verify_razorpay_signature(string $orderId, string $paymentId, string $signature): bool {
    $secret = payment_razorpay_secret();
    $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);
    return hash_equals($expected, $signature);
}

function payment_verify_webhook_signature(string $payload, string $signature): bool {
    $secret = env('RAZORPAY_WEBHOOK_SECRET', '');
    if ($secret === '') {
        $secret = payment_razorpay_secret();
    }

    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}

function payment_create_razorpay_order(array $event, array $guestData, string $paymentMethod): array {
    $amount = round((float) ($guestData['amount'] ?? 0), 2);
    $fee = payment_convenience_fee($amount);
    $total = $amount + $fee;
    $amountPaise = (int) round($total * 100);
    $receipt = 'GUEST_' . $event['id'] . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4));

    $notes = [
        'guest_token' => $guestData['guest_token'] ?? '',
        'event_id' => (string) $event['id'],
        'event_title' => payment_event_title($event),
        'guest_name' => $guestData['guest_name'] ?? '',
        'gift_type' => $guestData['gift_type'] ?? 'cash',
        'gift_amount' => (string) $amount,
        'convenience_fee' => (string) $fee,
        'total_amount' => (string) $total,
        'payment_method' => $paymentMethod,
    ];

    $razorpayOrder = payment_razorpay_request('POST', 'orders', [
        'amount' => $amountPaise,
        'currency' => 'INR',
        'receipt' => $receipt,
        'notes' => $notes,
    ]);

    if (empty($razorpayOrder['id'])) {
        payment_error('Could not create Razorpay order.', 502);
    }

    return [
        'id' => $razorpayOrder['id'],
        'receipt' => $receipt,
        'amount' => $amount,
        'fee' => $fee,
        'total' => $total,
        'amount_paise' => $amountPaise,
        'currency' => 'INR',
    ];
}

function payment_store_order(
    mysqli $db,
    array $event,
    array $guestData,
    string $paymentMethod,
    array $razorpayOrder
): int {
    $guestName = payment_clean_string($guestData['guest_name']);
    $phone = payment_nullable_string($guestData['phone'] ?? null);
    $email = payment_nullable_string($guestData['email'] ?? null);
    $city = payment_nullable_string($guestData['city'] ?? null);
    $company = payment_nullable_string($guestData['company'] ?? null);
    $occupation = payment_nullable_string($guestData['occupation'] ?? null);
    $relation = payment_normalize_enum($guestData['relation'] ?? 'friend', PAYMENT_VALID_RELATIONS, 'friend');
    $giftType = payment_normalize_enum($guestData['gift_type'] ?? 'cash', PAYMENT_VALID_GIFT_TYPES, 'cash');
    $note = payment_nullable_string($guestData['note'] ?? null);
    $guestToken = payment_clean_string($guestData['guest_token'] ?? '');
    $eventSlug = payment_clean_string($guestData['event_slug'] ?? $event['slug'] ?? '');
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    $payload = [
        'event' => $event,
        'guest' => $guestData,
        'razorpay_order' => $razorpayOrder,
        'payment_method' => $paymentMethod,
    ];

    $stmt = $db->prepare(
        'INSERT INTO payment_orders
        (guest_token, event_slug, event_id, guest_name, phone, email, city, company, occupation, relation, gift_type,
         amount, convenience_fee, total_amount, razorpay_order_id, receipt, payment_method, note, payload, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'ssisssssssdddssssss',
        $guestToken,
        $eventSlug,
        $event['id'],
        $guestName,
        $phone,
        $email,
        $city,
        $company,
        $occupation,
        $relation,
        $giftType,
        $razorpayOrder['amount'],
        $razorpayOrder['fee'],
        $razorpayOrder['total'],
        $razorpayOrder['id'],
        $razorpayOrder['receipt'],
        $paymentMethod,
        $note,
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $expiresAt
    );

    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $e) {
        payment_error('Could not save payment order. Please try again.', 500, ['details' => $e->getMessage()]);
    }

    return (int) $db->insert_id;
}

function payment_payment_mode_for_method(string $method): string {
    switch ($method) {
        case 'card':
            return 'card';
        case 'netbanking':
            return 'other';
        case 'wallet':
        case 'scan':
            return 'upi';
        case 'upi':
        case 'other':
            return $method;
        default:
            return 'upi';
    }
}

function payment_insert_moi_entry(mysqli $db, array $order, string $paymentId, string $paymentMethod): int {
    $existing = $db->prepare('SELECT id FROM moi_entries WHERE event_id = ? AND upi_ref_id = ? LIMIT 1');
    $existing->bind_param('is', $order['event_id'], $paymentId);
    $existing->execute();
    $existingRow = $existing->get_result()->fetch_assoc();
    if ($existingRow) {
        return (int) $existingRow['id'];
    }

    $noteParts = [];
    if (!empty($order['note'])) {
        $noteParts[] = $order['note'];
    }
    $noteParts[] = 'Razorpay ' . ucfirst($paymentMethod);

    $stmt = $db->prepare(
        'INSERT INTO moi_entries
        (event_id, guest_name, city, company, occupation, amount, gift_type, gold_weight, gift_description,
         approximate_value, relation, payment_mode, upi_ref_id, other_payment_details, note, entered_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'issssdsssssss',
        $order['event_id'],
        $order['guest_name'],
        $order['city'],
        $order['company'],
        $order['occupation'],
        $order['amount'],
        $order['gift_type'],
        $order['relation'],
        payment_payment_mode_for_method($paymentMethod),
        $paymentId,
        $paymentMethod,
        implode(' · ', $noteParts),
        'guest_qr'
    );

    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $e) {
        throw new Exception('Could not save contribution entry: ' . $e->getMessage());
    }

    return (int) $db->insert_id;
}

function payment_mark_order_paid(
    mysqli $db,
    array $order,
    string $paymentId,
    string $paymentMethod,
    array $payload,
    bool $insertEntry = true
): array {
    $paymentMode = payment_payment_mode_for_method($paymentMethod);
    $moiEntryId = null;

    if ($insertEntry) {
        $moiEntryId = payment_insert_moi_entry($db, $order, $paymentId, $paymentMethod);
    }

    $stmt = $db->prepare(
        'UPDATE payment_orders
         SET status = \'paid\', payment_id = ?, payment_method = ?, upi_ref_id = ?,
             other_payment_details = ?, payload = ?, paid_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status != \'paid\''
    );
    $stmt->bind_param(
        'sssssi',
        $paymentId,
        $paymentMethod,
        $paymentId,
        $paymentMode,
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $order['id']
    );
    $stmt->execute();

    return [
        'id' => (int) $order['id'],
        'order_id' => $order['razorpay_order_id'],
        'payment_id' => $paymentId,
        'transaction_id' => $paymentId,
        'status' => 'paid',
        'payment_method' => $paymentMethod,
        'amount' => (float) $order['amount'],
        'fee' => (float) $order['convenience_fee'],
        'total_amount' => (float) $order['total_amount'],
        'moi_entry_id' => $moiEntryId,
    ];
}

function payment_finalize_paid_order(
    mysqli $db,
    string $guestToken,
    string $eventSlug,
    string $orderId,
    string $paymentId,
    string $paymentMethod,
    array $payload
): array {
    $stmt = $db->prepare(
        'SELECT * FROM payment_orders
         WHERE razorpay_order_id = ?
           AND ((guest_token <> \'\' AND guest_token = ?) OR (event_slug <> \'\' AND event_slug = ?))
         FOR UPDATE'
    );
    $stmt->bind_param('sss', $orderId, $guestToken, $eventSlug);
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();

    if (!$order) {
        payment_error('Payment order not found.', 404);
    }

    if ($order['status'] === 'paid') {
        return [
            'success' => true,
            'already_paid' => true,
            'id' => (int) $order['id'],
            'order_id' => $order['razorpay_order_id'],
            'payment_id' => $order['payment_id'] ?: $paymentId,
            'transaction_id' => $order['payment_id'] ?: $paymentId,
            'status' => 'paid',
            'amount' => (float) $order['amount'],
            'fee' => (float) $order['convenience_fee'],
            'total_amount' => (float) $order['total_amount'],
            'payment_method' => $order['payment_method'] ?: $paymentMethod,
        ];
    }

    if (!empty($order['expires_at']) && strtotime($order['expires_at']) < time()) {
        $markExpired = $db->prepare('UPDATE payment_orders SET status = \'expired\' WHERE id = ? AND status = \'pending\'');
        $markExpired->bind_param('i', $order['id']);
        $markExpired->execute();
        payment_error('This payment order has expired. Please start again.', 400);
    }

    $db->begin_transaction();
    try {
        $result = payment_mark_order_paid($db, $order, $paymentId, $paymentMethod, $payload, true);
        $db->commit();
        return array_merge(['success' => true], $result);
    } catch (Exception $e) {
        $db->rollback();
        payment_error($e->getMessage(), 500);
    }
}

function payment_get_order_status(mysqli $db, string $guestToken, string $eventSlug, string $orderId): array {
    $stmt = $db->prepare(
        'SELECT po.*, e.event_type, e.custom_title, e.bride_name, e.groom_name, e.birthday_person_name
         FROM payment_orders po
         JOIN events e ON e.id = po.event_id
         WHERE po.razorpay_order_id = ?
           AND ((po.guest_token <> \'\' AND po.guest_token = ?) OR (po.event_slug <> \'\' AND po.event_slug = ?))'
    );
    $stmt->bind_param('sss', $orderId, $guestToken, $eventSlug);
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();

    if (!$order) {
        payment_error('Payment order not found.', 404);
    }

    return [
        'success' => true,
        'order' => [
            'id' => (int) $order['id'],
            'order_id' => $order['razorpay_order_id'],
            'status' => $order['status'],
            'payment_id' => $order['payment_id'],
            'transaction_id' => $order['payment_id'],
            'payment_method' => $order['payment_method'],
            'guest_name' => $order['guest_name'],
            'amount' => (float) $order['amount'],
            'fee' => (float) $order['convenience_fee'],
            'total_amount' => (float) $order['total_amount'],
            'created_at' => $order['created_at'],
            'expires_at' => $order['expires_at'],
            'paid_at' => $order['paid_at'],
            'event_title' => payment_event_title($order),
        ],
    ];
}

function payment_get_receipt(mysqli $db, string $guestToken, string $eventSlug, string $orderId): array {
    $stmt = $db->prepare(
        'SELECT po.*, e.event_type, e.custom_title, e.bride_name, e.groom_name, e.birthday_person_name, e.wedding_date, e.city
         FROM payment_orders po
         JOIN events e ON e.id = po.event_id
         WHERE po.razorpay_order_id = ?
           AND ((po.guest_token <> \'\' AND po.guest_token = ?) OR (po.event_slug <> \'\' AND po.event_slug = ?))
           AND po.status = \'paid\''
    );
    $stmt->bind_param('sss', $orderId, $guestToken, $eventSlug);
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();

    if (!$order) {
        payment_error('Paid receipt not found.', 404);
    }

    $entryStmt = $db->prepare('SELECT id, created_at FROM moi_entries WHERE event_id = ? AND upi_ref_id = ? LIMIT 1');
    $entryStmt->bind_param('is', $order['event_id'], $order['payment_id']);
    $entryStmt->execute();
    $entry = $entryStmt->get_result()->fetch_assoc();

    return [
        'success' => true,
        'receipt' => [
            'guest_name' => $order['guest_name'],
            'amount' => (float) $order['amount'],
            'fee' => (float) $order['convenience_fee'],
            'total_amount' => (float) $order['total_amount'],
            'gift_type' => $order['gift_type'],
            'payment_method' => $order['payment_method'],
            'transaction_id' => $order['payment_id'],
            'created_at' => $entry['created_at'] ?? $order['paid_at'],
            'event_title' => payment_event_title($order),
        ],
    ];
}

function payment_find_order_by_webhook_payload(mysqli $db, array $payload): ?array {
    $eventPayload = $payload['event']['payload'] ?? [];
    $orderId = $eventPayload['order']['id'] ?? $eventPayload['order']['entity']['id'] ?? null;
    $paymentId = $eventPayload['payment']['id'] ?? $eventPayload['payment']['entity']['id'] ?? null;

    if ($orderId) {
        $stmt = $db->prepare('SELECT * FROM payment_orders WHERE razorpay_order_id = ? FOR UPDATE');
        $stmt->bind_param('s', $orderId);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();
        if ($order) {
            return $order;
        }
    }

    if ($paymentId) {
        $stmt = $db->prepare('SELECT * FROM payment_orders WHERE payment_id = ? FOR UPDATE');
        $stmt->bind_param('s', $paymentId);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();
        if ($order) {
            return $order;
        }
    }

    return null;
}

function payment_handle_webhook_event(mysqli $db, array $payload): array {
    $eventName = $payload['event'] ?? $payload['event']['name'] ?? '';
    $eventPayload = $payload['event']['payload'] ?? [];
    $paymentEntity = $eventPayload['payment']['entity'] ?? $eventPayload['payment'] ?? [];
    $paymentId = $paymentEntity['id'] ?? '';
    $paymentMethod = $paymentEntity['method'] ?? 'upi';
    $paymentStatus = $paymentEntity['status'] ?? '';

    $order = payment_find_order_by_webhook_payload($db, $payload);
    if (!$order) {
        return ['success' => true, 'ignored' => 'order_not_found'];
    }

    if ($order['status'] === 'paid') {
        return ['success' => true, 'already_paid' => true];
    }

    if (in_array($eventName, ['payment.captured', 'order.paid'], true)) {
        $result = payment_mark_order_paid($db, $order, $paymentId, $paymentMethod, $payload, true);
        return ['success' => true, 'finalized' => $result];
    }

    if (in_array($eventName, ['payment.failed', 'payment.canceled', 'order.failed'], true)) {
        $status = $eventName === 'payment.canceled' ? 'cancelled' : 'failed';
        $stmt = $db->prepare('UPDATE payment_orders SET status = ?, payment_id = ?, payload = ? WHERE id = ? AND status = \'pending\'');
        $stmt->bind_param('sssi', $status, $paymentId, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $order['id']);
        $stmt->execute();
        return ['success' => true, 'status' => $status];
    }

    if ($paymentStatus === 'captured' && $paymentId !== '') {
        $result = payment_mark_order_paid($db, $order, $paymentId, $paymentMethod, $payload, true);
        return ['success' => true, 'finalized' => $result];
    }

    return ['success' => true, 'ignored' => $eventName];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'create-order') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        payment_error('Invalid request body.', 400);
    }

    $guestToken = payment_clean_string($data['guest_token'] ?? '');
    $eventSlug = payment_clean_string($data['event_slug'] ?? '');
    $guestData = is_array($data['guest_data'] ?? null) ? $data['guest_data'] : [];
    $paymentMethod = payment_normalize_enum($data['payment_method'] ?? 'upi', PAYMENT_VALID_METHODS, 'upi');

    if ($guestToken === '' && $eventSlug === '') {
        payment_error('Guest token or event slug is required.', 400);
    }

    $db = getDB();
    if ($guestToken !== '') {
        $event = payment_guest_event($db, $guestToken);
    } else {
        $event = payment_public_event($db, $eventSlug);
    }

    $guestData['guest_token'] = $guestToken;
    $guestData['event_slug'] = $event['slug'];
    $guestData['guest_name'] = payment_clean_string($guestData['guest_name'] ?? '');
    $guestData['gift_type'] = payment_normalize_enum($guestData['gift_type'] ?? 'cash', PAYMENT_VALID_GIFT_TYPES, 'cash');
    $guestData['amount'] = round((float) ($guestData['amount'] ?? 0), 2);

    if ($guestData['guest_name'] === '') {
        payment_error('Guest name is required.', 400);
    }
    if ($guestData['gift_type'] !== 'cash') {
        payment_error('Razorpay payments are available for cash contributions only.', 400);
    }
    if ($guestData['amount'] <= 0) {
        payment_error('Contribution amount is required.', 400);
    }

    try {
        $razorpayOrder = payment_create_razorpay_order($event, $guestData, $paymentMethod);
        $orderId = payment_store_order($db, $event, $guestData, $paymentMethod, $razorpayOrder);
    } catch (Exception $e) {
        payment_error($e->getMessage(), 500);
    }

    payment_json_response([
        'success' => true,
        'order_id' => $orderId,
        'razorpay_key_id' => payment_razorpay_key(),
        'order' => [
            'id' => $razorpayOrder['id'],
            'amount' => $razorpayOrder['amount_paise'],
            'currency' => $razorpayOrder['currency'],
            'receipt' => $razorpayOrder['receipt'],
        ],
        'guest_name' => $guestData['guest_name'],
        'email' => payment_nullable_string($guestData['email'] ?? null),
        'phone' => payment_nullable_string($guestData['phone'] ?? null),
        'amount' => $razorpayOrder['amount'],
        'fee' => $razorpayOrder['fee'],
        'total_amount' => $razorpayOrder['total'],
        'payment_method' => $paymentMethod,
        'event_title' => payment_event_title($event),
    ]);
}

if ($method === 'POST' && $action === 'verify-payment') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        payment_error('Invalid request body.', 400);
    }

    $guestToken = payment_clean_string($data['guest_token'] ?? '');
    $eventSlug = payment_clean_string($data['event_slug'] ?? '');
    $orderId = payment_clean_string($data['razorpay_order_id'] ?? '');
    $paymentId = payment_clean_string($data['razorpay_payment_id'] ?? '');
    $signature = payment_clean_string($data['razorpay_signature'] ?? '');
    $paymentMethod = payment_normalize_enum($data['payment_method'] ?? 'upi', PAYMENT_VALID_METHODS, 'upi');

    if ($guestToken === '' && $eventSlug === '') {
        payment_error('Guest token or event slug is required.', 400);
    }
    if ($orderId === '' || $paymentId === '' || $signature === '') {
        payment_error('Payment details are incomplete.', 400);
    }
    if (!payment_verify_razorpay_signature($orderId, $paymentId, $signature)) {
        payment_error('Payment signature verification failed.', 400);
    }

    try {
        $razorpayPayment = payment_razorpay_request('GET', 'payments/' . $paymentId);
    } catch (Exception $e) {
        payment_error($e->getMessage(), 502);
    }

    if (($razorpayPayment['status'] ?? '') !== 'captured') {
        payment_error('Payment is not captured yet. Please wait and try again.', 400);
    }
    if (($razorpayPayment['order_id'] ?? '') !== $orderId) {
        payment_error('Payment does not belong to this order.', 400);
    }

    $db = getDB();
    $payload = [
        'guest_token' => $guestToken,
        'event_slug' => $eventSlug,
        'payment_method' => $paymentMethod,
        'razorpay_payment' => $razorpayPayment,
        'verified_at' => date('c'),
    ];

    payment_json_response(payment_finalize_paid_order($db, $guestToken, $eventSlug, $orderId, $paymentId, $paymentMethod, $payload), 200);
}

if ($method === 'POST' && $action === 'webhook') {
    $payloadString = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

    if (!payment_verify_webhook_signature($payloadString, $signature)) {
        payment_error('Webhook signature verification failed.', 401);
    }

    $payload = json_decode($payloadString, true);
    if (!is_array($payload)) {
        payment_error('Invalid webhook payload.', 400);
    }

    $db = getDB();
    payment_json_response(payment_handle_webhook_event($db, $payload), 200);
}

if ($method === 'GET' && $action === 'status') {
    $guestToken = payment_clean_string($_GET['guest_token'] ?? '');
    $eventSlug = payment_clean_string($_GET['event_slug'] ?? '');
    $orderId = payment_clean_string($_GET['razorpay_order_id'] ?? '');

    if ($guestToken === '' && $eventSlug === '') {
        payment_error('Guest token or event slug is required.', 400);
    }
    if ($orderId === '') {
        payment_error('Order id is required.', 400);
    }

    $db = getDB();
    payment_json_response(payment_get_order_status($db, $guestToken, $eventSlug, $orderId), 200);
}

if ($method === 'GET' && $action === 'receipt') {
    $guestToken = payment_clean_string($_GET['guest_token'] ?? '');
    $eventSlug = payment_clean_string($_GET['event_slug'] ?? '');
    $orderId = payment_clean_string($_GET['razorpay_order_id'] ?? '');

    if ($guestToken === '' && $eventSlug === '') {
        payment_error('Guest token or event slug is required.', 400);
    }
    if ($orderId === '') {
        payment_error('Order id is required.', 400);
    }

    $db = getDB();
    payment_json_response(payment_get_receipt($db, $guestToken, $eventSlug, $orderId), 200);
}

payment_error('Payment endpoint not found.', 404);
