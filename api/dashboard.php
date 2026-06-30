<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method !== 'GET' || $action !== 'summary') {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

$db = getDB();
$userId = (int)$user['id'];

$summaryRows = $db->query("
    SELECT
        (SELECT COUNT(*) FROM events WHERE user_id = {$userId}) AS total_events,
        (SELECT COUNT(*) FROM moi_entries me JOIN events e ON e.id = me.event_id WHERE e.user_id = {$userId}) AS total_guests,
        (SELECT COALESCE(SUM(CASE WHEN me.gift_type = 'cash' OR me.gift_type IS NULL THEN CAST(me.amount AS DECIMAL(12,2)) ELSE 0 END), 0)
         FROM moi_entries me JOIN events e ON e.id = me.event_id WHERE e.user_id = {$userId}) AS total_cash,
        (SELECT COALESCE(SUM(CASE WHEN me.gift_type = 'gold' THEN CAST(me.gold_weight AS DECIMAL(12,2)) ELSE 0 END), 0)
         FROM moi_entries me JOIN events e ON e.id = me.event_id WHERE e.user_id = {$userId}) AS total_gold,
        (SELECT COUNT(*) FROM moi_entries me JOIN events e ON e.id = me.event_id WHERE e.user_id = {$userId} AND me.gift_type = 'gift') AS total_gifts,
        (SELECT COALESCE(ROUND(AVG(CASE WHEN me.gift_type = 'cash' OR me.gift_type IS NULL THEN CAST(me.amount AS DECIMAL(12,2)) END), 2), 0)
         FROM moi_entries me JOIN events e ON e.id = me.event_id WHERE e.user_id = {$userId}) AS avg_cash_gift,
        (SELECT COALESCE(SUM(CAST(rg.return_amount AS DECIMAL(12,2))), 0)
         FROM return_gifts rg JOIN events e ON e.id = rg.event_id
         WHERE e.user_id = {$userId} AND rg.status = 'pending') AS pending_returns
")->fetch_assoc();

$recentEntries = $db->query("
    SELECT
        me.id,
        me.event_id,
        me.guest_name,
        me.city,
        me.amount,
        me.gift_type,
        me.gold_weight,
        me.gift_description,
        me.payment_mode,
        me.created_at,
        e.event_type,
        e.custom_title,
        e.wedding_date
    FROM moi_entries me
    JOIN events e ON e.id = me.event_id
    WHERE e.user_id = {$userId}
    ORDER BY me.created_at DESC
    LIMIT 6
")->fetch_all(MYSQLI_ASSOC);

$recentEvents = $db->query("
    SELECT
        e.id,
        e.user_id,
        e.slug,
        e.event_type,
        e.custom_title,
        e.bride_name,
        e.groom_name,
        e.birthday_person_name,
        e.birthday_person_age,
        e.parent1_name,
        e.parent2_name,
        e.mother_name,
        e.father_name,
        e.host_name,
        e.spouse_name,
        e.graduate_name,
        e.wedding_date,
        e.city,
        e.venue,
        e.venue_latitude,
        e.venue_longitude,
        e.cover_photo,
        e.description,
        e.is_active,
        e.event_mode,
        e.approval_status,
        e.approval_reason,
        e.guest_token,
        e.qr_enabled,
        e.qr_payment_count,
        e.created_at,
        (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) AS guest_count,
        (SELECT COALESCE(SUM(amount), 0) FROM moi_entries WHERE event_id = e.id) AS total_moi
    FROM events e
    WHERE e.user_id = {$userId}
    ORDER BY e.created_at DESC
    LIMIT 4
")->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    'success' => true,
    'summary' => [
        'total_events' => (int)($summaryRows['total_events'] ?? 0),
        'total_guests' => (int)($summaryRows['total_guests'] ?? 0),
        'total_cash' => (float)($summaryRows['total_cash'] ?? 0),
        'total_gold' => (float)($summaryRows['total_gold'] ?? 0),
        'total_gifts' => (int)($summaryRows['total_gifts'] ?? 0),
        'avg_cash_gift' => (float)($summaryRows['avg_cash_gift'] ?? 0),
        'pending_returns' => (float)($summaryRows['pending_returns'] ?? 0),
    ],
    'recentEntries' => $recentEntries,
    'recentEvents' => $recentEvents,
]);
