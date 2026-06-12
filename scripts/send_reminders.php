<?php
/**
 * Send Reminders Script
 * Run via cron: php /path/to/scripts/send_reminders.php
 * 
 * - Sends notification 3 days before function date
 * - Sends notification on the day of function
 * - Sends weekly reminder for overdue pending returns
 */
require_once __DIR__ . '/../config/bootstrap.php';

$pdo = getPDO();

echo "Starting reminder processing...\n";

// 1. Send notifications 3 days before function date
$stmt = $pdo->prepare("
    SELECT e.id, e.user_id, e.event_type, e.wedding_date, e.city
    FROM events e
    WHERE e.wedding_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    AND e.is_active = 1
");
$stmt->execute();
$events3Days = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($events3Days as $event) {
    $eventName = ucfirst($event['event_type']) . ' - ' . date('d M Y', strtotime($event['wedding_date']));
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, event_id, title, message, type, scheduled_for)
        VALUES (?, ?, 'Function Reminder', ? , 'reminder', ?)
    ");
    $stmt->execute([
        $event['user_id'],
        $event['id'],
        "Your function '{$eventName}' is in 3 days on " . date('d M Y', strtotime($event['wedding_date'])),
        $event['wedding_date']
    ]);
    echo "Sent 3-day reminder for event: {$eventName}\n";
}

// 2. Send notifications on the day of function
$stmt = $pdo->prepare("
    SELECT e.id, e.user_id, e.event_type, e.wedding_date, e.city
    FROM events e
    WHERE e.wedding_date = CURDATE()
    AND e.is_active = 1
");
$stmt->execute();
$eventsToday = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($eventsToday as $event) {
    $eventName = ucfirst($event['event_type']) . ' - ' . date('d M Y', strtotime($event['wedding_date']));
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, event_id, title, message, type, scheduled_for)
        VALUES (?, ?, 'Function Today', ? , 'function_date', ?)
    ");
    $stmt->execute([
        $event['user_id'],
        $event['id'],
        "Your function '{$eventName}' is today! Have a great celebration!",
        $event['wedding_date']
    ]);
    echo "Sent today reminder for event: {$eventName}\n";
}

// 3. Send weekly reminder for overdue pending returns
$stmt = $pdo->prepare("
    SELECT e.id, e.user_id, e.event_type, e.wedding_date, e.city
    FROM events e
    WHERE e.wedding_date < CURDATE()
    AND e.is_active = 1
    AND (SELECT COUNT(*) FROM notifications n
         WHERE n.event_id = e.id
         AND n.type = 'return_gift'
         AND n.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) = 0
");
$stmt->execute();
$pastEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($pastEvents as $event) {
    $eventName = ucfirst($event['event_type']) . ' - ' . date('d M Y', strtotime($event['wedding_date']));
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, event_id, title, message, type)
        VALUES (?, ?, 'Return Gift Reminder', ? , 'return_gift')
    ");
    $stmt->execute([
        $event['user_id'],
        $event['id'],
        "Don't forget to track return gifts for '{$eventName}'"
    ]);
    echo "Sent return gift reminder for event: {$eventName}\n";
}

echo "Reminder processing complete.\n";