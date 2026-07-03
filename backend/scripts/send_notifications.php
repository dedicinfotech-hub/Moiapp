<?php
/**
 * Notification Scheduler Script
 * 
 * This script should be run via cron (e.g., every hour) to send scheduled notifications.
 * 
 * Cron setup (run every hour):
 * 0 * * * * /usr/bin/php /path/to/MoiApp/scripts/send_notifications.php
 * 
 * What it does:
 * 1. Sends reminders 3 days before function date
 * 2. Sends reminders on the day of function
 * 3. Sends weekly reminders for overdue return gifts
 * 4. Sends entry save confirmations (if not already sent)
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/push.php';

$db = getDB();

// ── 1. Reminders for events happening in 3 days ────────────────────────────────
$threeDaysFromNow = date('Y-m-d', strtotime('+3 days'));
$stmt = $db->prepare("
    SELECT DISTINCT e.id, e.user_id, e.custom_title, e.event_type, e.wedding_date, u.name as user_name
    FROM events e
    JOIN users u ON e.user_id = u.id
    WHERE e.event_mode = 'new'
      AND e.approval_status = 'approved'
      AND e.wedding_date = ?
      AND e.is_active = 1
      AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.event_id = e.id 
            AND n.type = 'reminder' 
            AND n.title LIKE '%3 days%'
            AND DATE(n.created_at) = CURDATE()
      )
");
$stmt->bind_param('s', $threeDaysFromNow);
$stmt->execute();
$events3Days = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($events3Days as $event) {
    $title = 'Reminder: Your function is in 3 days!';
    $message = "Your function '{$event['custom_title']}' is scheduled for {$event['wedding_date']}. Don't forget to prepare!";
    sendNotification($db, $event['user_id'], $event['id'], $title, $message, 'reminder');
}

// ── 2. Reminders for events happening today ────────────────────────────────────
$today = date('Y-m-d');
$stmt = $db->prepare("
    SELECT DISTINCT e.id, e.user_id, e.custom_title, e.event_type, e.wedding_date, u.name as user_name
    FROM events e
    JOIN users u ON e.user_id = u.id
    WHERE e.event_mode = 'new'
      AND e.approval_status = 'approved'
      AND e.wedding_date = ?
      AND e.is_active = 1
      AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.event_id = e.id 
            AND n.type = 'function_date' 
            AND n.title LIKE '%today%'
            AND DATE(n.created_at) = CURDATE()
      )
");
$stmt->bind_param('s', $today);
$stmt->execute();
$eventsToday = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($eventsToday as $event) {
    $title = 'Today is your function day!';
    $message = "Your function '{$event['custom_title']}' is today. Best wishes!";
    sendNotification($db, $event['user_id'], $event['id'], $title, $message, 'function_date');
}

// ── 3. Weekly reminders for overdue return gifts ───────────────────────────────
$stmt = $db->prepare("
    SELECT DISTINCT rg.id, rg.event_id, rg.guest_name, rg.return_type, rg.return_date, 
           e.user_id, e.custom_title, u.name as user_name
    FROM return_gifts rg
    JOIN events e ON rg.event_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE rg.status = 'pending'
      AND rg.return_date IS NOT NULL
      AND rg.return_date < CURDATE()
      AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.event_id = rg.event_id 
            AND n.type = 'return_gift' 
            AND n.title LIKE CONCAT('%', rg.guest_name, '%')
            AND DATE(n.created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
");
$stmt->execute();
$overdueGifts = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($overdueGifts as $gift) {
    $title = "Overdue: Return gift for {$gift['guest_name']}";
    $message = "The return gift for '{$gift['guest_name']}' (type: {$gift['return_type']}) was due on {$gift['return_date']}. Please follow up.";
    sendNotification($db, $gift['user_id'], $gift['event_id'], $title, $message, 'return_gift');
}

// ── 4. Entry save confirmations (for recent entries without confirmation) ───────
$stmt = $db->prepare("
    SELECT me.id, me.event_id, me.guest_name, me.amount, me.created_at,
           e.user_id, e.custom_title, u.name as user_name
    FROM moi_entries me
    JOIN events e ON me.event_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE me.entered_by = 'host'
      AND me.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.event_id = me.event_id 
            AND n.type = 'entry_saved' 
            AND n.title LIKE CONCAT('%', me.guest_name, '%')
            AND DATE(n.created_at) = DATE(me.created_at)
      )
");
$stmt->execute();
$recentEntries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($recentEntries as $entry) {
    $title = "Moi entry saved for {$entry['guest_name']}";
    $message = "Successfully recorded ₹{$entry['amount']} from {$entry['guest_name']} for '{$entry['custom_title']}'.";
    sendNotification($db, $entry['user_id'], $entry['event_id'], $title, $message, 'entry_saved');
}

echo json_encode([
    'success' => true,
    'notifications_sent' => count($events3Days) + count($eventsToday) + count($overdueGifts) + count($recentEntries),
    'details' => [
        'reminders_3_days' => count($events3Days),
        'reminders_today' => count($eventsToday),
        'overdue_gifts' => count($overdueGifts),
        'entry_confirmations' => count($recentEntries),
    ]
]);

function sendNotification(mysqli $db, int $userId, ?int $eventId, string $title, string $message, string $type): void {
    $stmt = $db->prepare("
        INSERT INTO notifications (user_id, event_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
    ");
    $eventIdNull = $eventId;
    $stmt->bind_param('iisss', $userId, $eventIdNull, $title, $message, $type);
    $stmt->execute();
    sendExpoPushToUser($db, $userId, $title, $message, $type, $eventId);
}
