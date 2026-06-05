<?php
/**
 * MoiApp — PDF Export + Email
 * Generates a PDF of all moi entries for an event and emails it to the organizer
 * 
 * Usage: GET /api/pdf.php?event_id=X
 * Requires: Auth token in X-Auth-Token header
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

// CORS for file download
$origin = env('CORS_ORIGIN', 'http://localhost:3000');
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');

$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$eventId = intval($_GET['event_id'] ?? 0);
$action  = $_GET['action'] ?? '';

if (!$eventId) {
    http_response_code(400);
    echo json_encode(['error' => 'event_id is required']);
    exit;
}

$db = getDB();

// Check if admin
$stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
$stmtRole->bind_param('i', $user['id']);
$stmtRole->execute();
$roleRow = $stmtRole->get_result()->fetch_assoc();
$isAdmin = ($roleRow['role'] ?? 'user') === 'admin';

// ── Fetch event details ────────────────────────────────────────────────────────
if ($isAdmin) {
    $stmt = $db->prepare('SELECT e.*, u.name as creator, u.email as creator_email FROM events e JOIN users u ON e.user_id=u.id WHERE e.id=?');
    $stmt->bind_param('i', $eventId);
} else {
    $stmt = $db->prepare('SELECT e.*, u.name as creator, u.email as creator_email FROM events e JOIN users u ON e.user_id=u.id WHERE e.id=? AND e.user_id=?');
    $stmt->bind_param('ii', $eventId, $user['id']);
}
$stmt->execute();
$event = $stmt->get_result()->fetch_assoc();

if (!$event) {
    http_response_code(404);
    echo json_encode(['error' => 'Event not found']);
    exit;
}

// ── Fetch moi entries ──────────────────────────────────────────────────────────
$stmt = $db->prepare('SELECT * FROM moi_entries WHERE event_id=? ORDER BY created_at ASC');
$stmt->bind_param('i', $eventId);
$stmt->execute();
$entries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// ── Calculate totals ───────────────────────────────────────────────────────────
$totalCash = 0;
$totalGold = 0;
$totalGifts = 0;
$totalGuests = count($entries);

foreach ($entries as $e) {
    if ($e['gift_type'] === 'cash') {
        $totalCash += floatval($e['amount']);
    } elseif ($e['gift_type'] === 'gold') {
        $totalGold += floatval($e['gold_weight'] ?? 0);
    } else {
        $totalGifts++;
    }
}

// ── Generate HTML report ───────────────────────────────────────────────────────
$eventTypeLabel = ucfirst($event['event_type']);
$eventTitle = $event['event_type'] === 'wedding'
    ? $event['bride_name'] . ' & ' . $event['groom_name'] . ' Wedding'
    : $event['birthday_person_name'] . "'s Birthday";

$eventDate = date('d M Y', strtotime($event['wedding_date']));
$venueLine = $event['venue'] ? '<p><strong>Venue:</strong> ' . $event['venue'] . '</p>' : '';
$generatedDate = date('d M Y, h:i A');

// Build table rows
$tableRows = '';
foreach ($entries as $idx => $e) {
    $i = $idx + 1;
    $giftTypeLabel = ucfirst($e['gift_type']);
    
    if ($e['gift_type'] === 'cash') {
        $amountDisplay = '₹' . number_format($e['amount'], 2);
    } elseif ($e['gift_type'] === 'gold') {
        $amountDisplay = number_format($e['gold_weight'], 2) . ' g';
    } else {
        $amountDisplay = $e['gift_description'] ?: 'Gift';
    }
    
    $noteDisplay = $e['note'] ?: '-';
    $entryDate = date('d M Y', strtotime($e['created_at']));
    
    $tableRows .= '<tr>' .
        '<td>' . $i . '</td>' .
        '<td>' . htmlspecialchars($e['guest_name']) . '</td>' .
        '<td>' . $giftTypeLabel . '</td>' .
        '<td>' . $amountDisplay . '</td>' .
        '<td>' . $e['relation'] . '</td>' .
        '<td>' . $e['payment_mode'] . '</td>' .
        '<td>' . htmlspecialchars($noteDisplay) . '</td>' .
        '<td>' . $entryDate . '</td>' .
        '</tr>';
}

$html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Moi Report - ' . $eventTitle . '</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #FFC107; padding-bottom: 20px; }
        .header h1 { font-size: 24px; color: #101010; margin-bottom: 5px; }
        .header .subtitle { font-size: 14px; color: #666; }
        .event-info { background: #FFFCF5; border: 1px solid #FFE082; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
        .event-info p { margin: 5px 0; font-size: 14px; }
        .event-info strong { color: #101010; }
        .summary { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
        .summary-card { flex: 1; min-width: 120px; background: #f8f8f8; border-radius: 8px; padding: 15px; text-align: center; }
        .summary-card .number { font-size: 22px; font-weight: bold; color: #FFC107; }
        .summary-card .label { font-size: 12px; color: #666; margin-top: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #FFC107; color: #101010; padding: 10px 8px; text-align: left; font-size: 12px; font-weight: bold; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
        tr:nth-child(even) { background: #fafafa; }
        .total-row { font-weight: bold; background: #FFF8E1 !important; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        .print-btn { display: block; width: 200px; margin: 20px auto; padding: 12px; background: #FFC107; color: #101010; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; }
        .print-btn:hover { background: #E6AC00; }
        @media print {
            .print-btn { display: none; }
            body { padding: 20px; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    
    <div class="header">
        <h1>Moi Report</h1>
        <p class="subtitle">Generated on ' . $generatedDate . '</p>
    </div>

    <div class="event-info">
        <p><strong>Event:</strong> ' . $eventTitle . '</p>
        <p><strong>Type:</strong> ' . $eventTypeLabel . '</p>
        <p><strong>Date:</strong> ' . $eventDate . '</p>
        ' . $venueLine . '
        <p><strong>Organizer:</strong> ' . $event['creator'] . '</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <div class="number">' . $totalGuests . '</div>
            <div class="label">Total Guests</div>
        </div>
        <div class="summary-card">
            <div class="number">₹' . number_format($totalCash, 2) . '</div>
            <div class="label">Total Cash</div>
        </div>
        <div class="summary-card">
            <div class="number">' . $totalGold . ' g</div>
            <div class="label">Total Gold</div>
        </div>
        <div class="summary-card">
            <div class="number">' . $totalGifts . '</div>
            <div class="label">Other Gifts</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Guest Name</th>
                <th>Type</th>
                <th>Amount / Weight</th>
                <th>Relation</th>
                <th>Payment Mode</th>
                <th>Note</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
' . $tableRows . '
        </tbody>
    </table>

    <div class="footer">
        <p>Generated by MoiApp — Track gifts easily. Share with family.</p>
        <p>Event ID: ' . $event['id'] . ' | Report Date: ' . date('Y-m-d H:i:s') . '</p>
    </div>
</body>
</html>';

// ── Send email with report link ────────────────────────────────────────────────
$to = $event['creator_email'];
$subject = 'Moi Report — ' . $eventTitle;
$downloadUrl = ($_SERVER['HTTP_ORIGIN'] ?? '') . '/api/pdf.php?event_id=' . $eventId . '&action=download';

$body = '<html><body style="font-family: Arial, sans-serif; color: #333;">';
$body .= '<h2 style="color: #101010;">Moi Report Ready</h2>';
$body .= '<p>Dear ' . $event['creator'] . ',</p>';
$body .= '<p>Your Moi Report for <strong>' . $eventTitle . '</strong> is ready.</p>';
$body .= '<ul>';
$body .= '<li><strong>Total Guests:</strong> ' . $totalGuests . '</li>';
$body .= '<li><strong>Total Cash:</strong> ₹' . number_format($totalCash, 2) . '</li>';
$body .= '<li><strong>Total Gold:</strong> ' . $totalGold . ' g</li>';
$body .= '<li><strong>Other Gifts:</strong> ' . $totalGifts . '</li>';
$body .= '</ul>';
$body .= '<p><a href="' . $downloadUrl . '" style="background: #FFC107; color: #101010; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View / Download PDF Report</a></p>';
$body .= '<p style="color: #666; font-size: 12px;">Click the button above to view the report. Use your browser\'s Print function (Ctrl+P / Cmd+P) and select "Save as PDF" to download.</p>';
$body .= '<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">';
$body .= '<p style="color: #999; font-size: 11px;">Generated by MoiApp</p>';
$body .= '</body></html>';

$headers = 'From: MoiApp <noreply@moiapp.com>' . "\r\n";
$headers .= 'Reply-To: noreply@moiapp.com' . "\r\n";
$headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";

$mailSent = mail($to, $subject, $body, $headers);

// ── Return response ────────────────────────────────────────────────────────────
if ($action === 'download') {
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="moi_report_' . preg_replace('/[^a-z0-9_-]/i', '_', $event['slug']) . '.html"');
    echo $html;
    exit;
}

echo json_encode([
    'success' => true,
    'message' => $mailSent ? 'PDF report emailed successfully' : 'Report generated (email may not have been sent)',
    'download_url' => '/api/pdf.php?event_id=' . $eventId . '&action=download',
    'stats' => [
        'total_guests' => $totalGuests,
        'total_cash' => $totalCash,
        'total_gold' => $totalGold,
        'total_gifts' => $totalGifts,
    ]
]);
exit;
