<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── Admin Authentication Check ───────────────────────────────────────────────────
function requireAdmin() {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $db = getDB();
    $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    
    if (!$row || $row['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    
    return $user;
}

// ── Get Admin Statistics ───────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'stats') {
    requireAdmin();
    $db = getDB();
    
    // Total users
    $totalUsers = $db->query('SELECT COUNT(*) as count FROM users WHERE role = "user"')->fetch_assoc()['count'];
    
    // New users today
    $today = date('Y-m-d');
    $newToday = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND DATE(created_at) = '$today'")->fetch_assoc()['count'];
    
    // Active today (users who have events with activity today)
    $activeToday = $db->query("
        SELECT COUNT(DISTINCT u.id) as count 
        FROM users u 
        JOIN events e ON u.id = e.user_id 
        WHERE u.role = 'user' AND DATE(e.created_at) = '$today'
    ")->fetch_assoc()['count'];
    
    // Total functions created on platform
    $totalFunctions = $db->query('SELECT COUNT(*) as count FROM events')->fetch_assoc()['count'];
    
    // This month's revenue (sum of all cash moi entries)
    $thisMonth = date('Y-m');
    $monthlyRevenue = $db->query("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM moi_entries 
        WHERE (gift_type = 'cash' OR gift_type IS NULL) 
        AND DATE_FORMAT(created_at, '%Y-%m') = '$thisMonth'
    ")->fetch_assoc()['total'];
    
    // Last month's revenue
    $lastMonth = date('Y-m', strtotime('first day of last month'));
    $lastMonthRevenue = $db->query("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM moi_entries 
        WHERE (gift_type = 'cash' OR gift_type IS NULL) 
        AND DATE_FORMAT(created_at, '%Y-%m') = '$lastMonth'
    ")->fetch_assoc()['total'];
    
    // Total revenue since launch
    $totalRevenue = $db->query("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM moi_entries 
        WHERE gift_type = 'cash' OR gift_type IS NULL
    ")->fetch_assoc()['total'];
    
    // Open support tickets
    $openTickets = $db->query("SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')")->fetch_assoc()['count'];

    // Pending function approvals (new events only)
    $pendingApprovals = $db->query("SELECT COUNT(*) as count FROM events WHERE event_mode = 'new' AND approval_status = 'pending'")->fetch_assoc()['count'];
    
    // Active private events (new events with QR enabled)
    $activePrivateEvents = $db->query("SELECT COUNT(*) as count FROM events WHERE event_mode = 'new' AND approval_status = 'approved' AND qr_enabled = 1")->fetch_assoc()['count'];
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'totalUsers' => (int)$totalUsers,
            'newToday' => (int)$newToday,
            'activeToday' => (int)$activeToday,
            'totalFunctions' => (int)$totalFunctions,
            'monthlyRevenue' => (float)$monthlyRevenue,
            'lastMonthRevenue' => (float)$lastMonthRevenue,
            'totalRevenue' => (float)$totalRevenue,
            'openTickets' => (int)$openTickets,
            'pendingApprovals' => (int)$pendingApprovals,
            'activePrivateEvents' => (int)$activePrivateEvents,
        ]
    ]);
    exit;
}

// ── Get All Active Private Events (Admin Monitoring) ───────────────────────────
if ($method === 'GET' && $action === 'private-events') {
    requireAdmin();
    $db = getDB();
    
    $sql = "
        SELECT e.id, e.event_type, e.wedding_date, e.venue, e.city,
               u.name as host_name, u.email as host_email, u.phone as host_phone,
               (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
               (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi,
               e.qr_enabled, e.guest_token, e.created_at
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.event_mode = 'new' AND e.approval_status = 'approved'
        ORDER BY e.wedding_date DESC
        LIMIT 100
    ";
    
    $events = $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode(['success' => true, 'events' => $events]);
    exit;
}

// ── Deactivate Private Event (Admin) ───────────────────────────────────────────
if ($method === 'PUT' && $action === 'deactivate-event' && $id) {
    requireAdmin();
    $db = getDB();
    
    $stmt = $db->prepare('UPDATE events SET qr_enabled = 0 WHERE id = ? AND event_mode = \'new\' AND approval_status = \'approved\'');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Private event deactivated']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found or already deactivated']);
    }
    exit;
}

// ── Get User List for Admin ─────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'users') {
    requireAdmin();
    $db = getDB();
    
    $search = $_GET['search'] ?? '';
    $filter = $_GET['filter'] ?? 'all';
    
    $where = "WHERE u.role = 'user'";
    
    if ($search) {
        $searchTerm = "%$search%";
        $where .= " AND (u.name LIKE ? OR u.phone LIKE ?)";
    }
    
    if ($filter === 'active') {
        $where .= " AND u.id IN (SELECT DISTINCT user_id FROM events WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY))";
    } elseif ($filter === 'inactive') {
        $where .= " AND u.id NOT IN (SELECT DISTINCT user_id FROM events WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY))";
    } elseif ($filter === 'blocked') {
        $where .= " AND u.is_blocked = 1";
    }
    
    $sql = "
        SELECT u.id, u.name, u.city, u.phone, u.created_at,
               (SELECT COUNT(*) FROM events WHERE user_id = u.id) as function_count
        FROM users u
        $where
        ORDER BY u.created_at DESC
        LIMIT 100
    ";
    
    $stmt = $db->prepare($sql);
    if ($search) {
        $stmt->bind_param('ss', $searchTerm, $searchTerm);
    }
    $stmt->execute();
    $users = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode(['success' => true, 'users' => $users]);
    exit;
}

// ── Block User ───────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'block-user') {
    requireAdmin();
    $db = getDB();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)($data['user_id'] ?? 0);
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        exit;
    }
    
    $stmt = $db->prepare('UPDATE users SET is_blocked = 1 WHERE id = ? AND role = "user"');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'User blocked successfully']);
    exit;
}

// ── Delete User ──────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'delete-user') {
    requireAdmin();
    $db = getDB();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)($data['user_id'] ?? 0);
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        exit;
    }
    
    // Delete user's events and related data (cascade)
    $stmt = $db->prepare('DELETE FROM users WHERE id = ? AND role = "user"');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    exit;
}

// ── Get Analytics Data ───────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'analytics') {
    requireAdmin();
    $db = getDB();
    
    $period = $_GET['period'] ?? 'daily';
    
    // User growth data
    if ($period === 'daily') {
        $userGrowth = $db->query("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        ")->fetch_all(MYSQLI_ASSOC);
    } elseif ($period === 'weekly') {
        $userGrowth = $db->query("
            SELECT YEARWEEK(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY YEARWEEK(created_at) 
            ORDER BY date ASC
        ")->fetch_all(MYSQLI_ASSOC);
    } else { // monthly
        $userGrowth = $db->query("
            SELECT DATE_FORMAT(created_at, '%Y-%m') as date, COUNT(*) as count 
            FROM users 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m') 
            ORDER BY date ASC
        ")->fetch_all(MYSQLI_ASSOC);
    }
    
    // Top 5 cities
    $topCities = $db->query("
        SELECT city, COUNT(*) as count 
        FROM users 
        WHERE role = 'user' AND city IS NOT NULL AND city != ''
        GROUP BY city 
        ORDER BY count DESC 
        LIMIT 5
    ")->fetch_all(MYSQLI_ASSOC);
    
    // Peak function months
    $peakMonths = $db->query("
        SELECT DATE_FORMAT(wedding_date, '%Y-%m') as month, COUNT(*) as count 
        FROM events 
        GROUP BY DATE_FORMAT(wedding_date, '%Y-%m') 
        ORDER BY count DESC 
        LIMIT 6
    ")->fetch_all(MYSQLI_ASSOC);
    
    // Most used features (based on events created)
    $featureUsage = $db->query("
        SELECT event_type, COUNT(*) as count
        FROM events
        GROUP BY event_type
        ORDER BY count DESC
    ")->fetch_all(MYSQLI_ASSOC);
    
    // Free vs Premium user ratio
    $premiumCount = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND is_premium = 1")->fetch_assoc()['count'];
    $freeCount = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND (is_premium IS NULL OR is_premium = 0)")->fetch_assoc()['count'];
    
    echo json_encode([
        'success' => true,
        'analytics' => [
            'userGrowth' => $userGrowth,
            'topCities' => $topCities,
            'peakMonths' => $peakMonths,
            'featureUsage' => $featureUsage,
            'premiumRatio' => [
                'premium' => (int)$premiumCount,
                'free' => (int)$freeCount,
            ],
        ]
    ]);
    exit;
}

// ── Get Support Tickets ─────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'tickets') {
    requireAdmin();
    $db = getDB();
    
    $status = $_GET['status'] ?? 'open';
    
    $sql = "
        SELECT t.id, t.user_id, t.subject, t.message, t.status, t.created_at,
               u.name as user_name, u.email as user_email
        FROM support_tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.status IN ('open', 'in_progress', 'resolved')
    ";
    
    if ($status !== 'all') {
        $sql .= " AND t.status = '$status'";
    }
    
    $sql .= " ORDER BY t.created_at DESC LIMIT 100";
    
    $tickets = $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode(['success' => true, 'tickets' => $tickets]);
    exit;
}

// ── Resolve Ticket ──────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'resolve-ticket') {
    requireAdmin();
    $db = getDB();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $ticketId = (int)($data['ticket_id'] ?? 0);
    
    if (!$ticketId) {
        http_response_code(400);
        echo json_encode(['error' => 'Ticket ID required']);
        exit;
    }
    
    $stmt = $db->prepare('UPDATE support_tickets SET status = "resolved", resolved_at = NOW() WHERE id = ?');
    $stmt->bind_param('i', $ticketId);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Ticket resolved successfully']);
    exit;
}

// ── Archive old resolved tickets (30 days) ───────────────────────────────────────
if ($method === 'POST' && $action === 'archive-tickets') {
    requireAdmin();
    $db = getDB();
    
    // Archive resolved tickets older than 30 days
    $stmt = $db->prepare('UPDATE support_tickets SET archived_at = NOW() WHERE status = "resolved" AND resolved_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND archived_at IS NULL');
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Old tickets archived']);
    exit;
}

// ── Get Feature Toggles ─────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'features') {
    requireAdmin();
    $db = getDB();
    
    $features = $db->query('SELECT id, feature_key, is_enabled, description FROM feature_toggles ORDER BY id DESC')->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode(['success' => true, 'features' => $features]);
    exit;
}

// ── Update Feature Toggle ───────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'toggle-feature') {
    requireAdmin();
    $user = getAuthUser();
    $db = getDB();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $featureId = (int)($data['id'] ?? 0);
    $isEnabled = (int)($data['is_enabled'] ?? 0);
    
    if (!$featureId) {
        http_response_code(400);
        echo json_encode(['error' => 'Feature ID required']);
        exit;
    }
    
    $stmt = $db->prepare('UPDATE feature_toggles SET is_enabled = ?, updated_by = ? WHERE id = ?');
    $stmt->bind_param('iii', $isEnabled, $user['id'], $featureId);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Feature updated successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);