<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

// CORS for file download — override origin from env
$origin = env('CORS_ORIGIN', 'http://localhost:3000');
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');

$user = getAuthUser();
if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

$eventId = intval($_GET['event_id'] ?? 0);
$format  = $_GET['format'] ?? 'csv';

$db   = getDB();
$stmt = $db->prepare('SELECT e.*, u.name as creator FROM events e JOIN users u ON e.user_id=u.id WHERE e.id=? AND e.user_id=?');
$stmt->bind_param('ii', $eventId, $user['id']);
$stmt->execute();
$event = $stmt->get_result()->fetch_assoc();

if (!$event) { http_response_code(404); echo json_encode(['error' => 'Event not found']); exit; }

$stmt = $db->prepare('SELECT * FROM moi_entries WHERE event_id=? ORDER BY created_at ASC');
$stmt->bind_param('i', $eventId);
$stmt->execute();
$entries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$filename = preg_replace('/[^a-z0-9_-]/i', '_', $event['bride_name'] . '_' . $event['groom_name'] . '_moi');

if ($format === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM
    fputcsv($out, ['#', 'Guest Name', 'Amount (Rs)', 'Relation', 'Payment Mode', 'Note', 'Date']);
    $total = 0;
    foreach ($entries as $i => $e) {
        fputcsv($out, [
            $i + 1,
            $e['guest_name'],
            $e['amount'],
            ucfirst($e['relation']),
            ucfirst($e['payment_mode']),
            $e['note'],
            date('d M Y, h:i A', strtotime($e['created_at'])),
        ]);
        $total += $e['amount'];
    }
    fputcsv($out, ['', 'TOTAL', number_format($total, 2), '', '', '', '']);
    fclose($out);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Unsupported format']);
}
