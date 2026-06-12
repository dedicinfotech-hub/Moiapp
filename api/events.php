<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

// Helper function to handle null values in bind_param
function refValues($arr) {
    if (strnatcmp(phpversion(), '5.3') >= 0) {
        $refs = [];
        foreach ($arr as $key => $value) {
            $refs[$key] = &$arr[$key];
        }
        return $refs;
    }
    return $arr;
}

$method = $_SERVER['REQUEST_METHOD'];
$slug   = $_GET['slug']   ?? '';
$id     = intval($_GET['id'] ?? 0);
$public = $_GET['public'] ?? '';
$action = $_GET['action'] ?? '';

// ── POST upload cover photo ───────────────────────────────────────────────────
if ($method === 'POST' && $action === 'cover') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $evId = intval($_POST['event_id'] ?? 0);
    if (!$evId || empty($_FILES['cover'])) {
        http_response_code(400); echo json_encode(['error' => 'event_id and cover file required']); exit;
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM events WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ii', $evId, $user['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
    }

    $file     = $_FILES['cover'];
    $allowed  = ['image/jpeg', 'image/png', 'image/webp'];
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowed)) {
        http_response_code(400); echo json_encode(['error' => 'Only JPG, PNG, WEBP allowed']); exit;
    }
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400); echo json_encode(['error' => 'Max 10MB']); exit;
    }

    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
    $subDir   = 'covers/' . date('Y/m');
    $uploadDir = dirname(__DIR__) . '/uploads/' . $subDir . '/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $filename = 'cover_' . $evId . '_' . uniqid() . '.' . $ext;
    move_uploaded_file($file['tmp_name'], $uploadDir . $filename);

    $appUrl    = rtrim(env('APP_URL', 'http://localhost:8888/MoiApp'), '/');
    $coverUrl  = $appUrl . '/uploads/' . $subDir . '/' . $filename;

    $stmt = $db->prepare('UPDATE events SET cover_photo = ? WHERE id = ?');
    $stmt->bind_param('si', $coverUrl, $evId);
    $stmt->execute();

    echo json_encode(['success' => true, 'url' => $coverUrl]);
    exit;
}

// ── GET all events PUBLIC listing ─────────────────────────────────────────────
if ($method === 'GET' && $public === '1') {
    $db   = getDB();
    $stmt = $db->prepare(
        "SELECT e.id, e.slug, e.event_type, e.bride_name, e.groom_name,
                e.birthday_person_name, e.birthday_person_age, e.parent1_name, e.parent2_name,
                e.mother_name, e.father_name, e.host_name, e.spouse_name, e.graduate_name,
                e.wedding_date, e.venue, e.city,
                e.cover_photo, e.description, e.created_at,
                u.name as creator_name,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE e.is_active = 1
           AND (e.event_mode = 'past' OR e.approval_status = 'approved')
         ORDER BY e.wedding_date ASC"
    );
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$row) {
        $row['cover_photo'] = normalizeCoverUrl($row['cover_photo']);
    }
    echo json_encode($rows);
    exit;
}

// ── GET event by private guest token (QR payment page) ───────────────────────
$guestToken = trim($_GET['guest_token'] ?? '');
if ($method === 'GET' && $guestToken) {
    $db = getDB();
    $stmt = $db->prepare(
        'SELECT e.*, u.name as creator_name,
                u.upi_id, u.bank_name, u.account_number, u.ifsc_code, u.account_holder, u.phone as organizer_phone
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE e.guest_token = ? AND e.is_active = 1
           AND e.event_mode = \'new\''
    );
    $stmt->bind_param('s', $guestToken);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();

    if (!$event) {
        http_response_code(404);
        echo json_encode(['error' => 'private_event', 'message' => 'This is a private event. You need an invitation to access this page.']);
        exit;
    }

    if ($event['approval_status'] !== 'approved' || $event['qr_enabled'] != 1) {
        http_response_code(404);
        echo json_encode(['error' => 'event_closed', 'message' => 'This event is no longer accepting moi. Please contact the host.']);
        exit;
    }

    $event['cover_photo'] = normalizeCoverUrl($event['cover_photo']);

    $stmt2 = $db->prepare(
        'SELECT COUNT(*) as guest_count, COALESCE(SUM(amount),0) as total,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = ? AND entered_by = \'guest_qr\') as qr_payment_count
         FROM moi_entries WHERE event_id = ?'
    );
    $stmt2->bind_param('ii', $event['id'], $event['id']);
    $stmt2->execute();
    $event['stats'] = $stmt2->get_result()->fetch_assoc();

    echo json_encode($event);
    exit;
}

// ── GET single event by slug (PUBLIC — no auth needed) ────────────────────────
if ($method === 'GET' && $slug) {
    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT e.*, u.name as creator_name,
                u.upi_id, u.bank_name, u.account_number, u.ifsc_code, u.account_holder, u.phone as organizer_phone
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE e.slug = ? AND e.is_active = 1'
    );
    $stmt->bind_param('s', $slug);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();

    if (!$event) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
        exit;
    }

    $event['cover_photo'] = normalizeCoverUrl($event['cover_photo']);

    // Public stats
    $stmt2 = $db->prepare(
        'SELECT COUNT(*) as guest_count, COALESCE(SUM(amount),0) as total,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = ? AND entered_by = \'guest_qr\') as qr_payment_count
         FROM moi_entries WHERE event_id = ?'
    );
    $stmt2->bind_param('ii', $event['id'], $event['id']);
    $stmt2->execute();
    $event['stats'] = $stmt2->get_result()->fetch_assoc();

    echo json_encode($event);
    exit;
}

// ── GET pending approvals (admin only) ────────────────────────────────────────
if ($method === 'GET' && $action === 'pending') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db = getDB();
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    if (($roleRow['role'] ?? 'user') !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $filter = $_GET['status'] ?? 'pending';
    $where = "e.approval_status = 'pending'";
    if ($filter === 'rejected') {
        $where = "e.approval_status = 'rejected'";
    } elseif ($filter === 'all') {
        $where = "e.approval_status IN ('pending', 'rejected')";
    }

    $stmt = $db->prepare(
        "SELECT e.*, u.name as creator_name, u.phone as creator_phone
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE $where AND e.event_mode = 'new'
         ORDER BY e.created_at DESC"
    );
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$row) {
        $row['cover_photo'] = normalizeCoverUrl($row['cover_photo']);
    }
    echo json_encode($rows);
    exit;
}

// ── GET all events for logged-in user (admin sees all) ────────────────────────
if ($method === 'GET') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    // Fetch user role
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    $userRole = $roleRow['role'] ?? 'user';
    $isAdmin = $userRole === 'admin';

    if ($isAdmin) {
        // Admin sees all events
        $stmt = $db->prepare(
            'SELECT e.*, u.name as creator_name,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id AND entered_by = \'guest_qr\') as qr_payment_count
             FROM events e
             JOIN users u ON e.user_id = u.id
             ORDER BY e.created_at DESC'
        );
        $stmt->execute();
    } else {
        // Regular user sees only their own events
        $stmt = $db->prepare(
            'SELECT e.*,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id AND entered_by = \'guest_qr\') as qr_payment_count
             FROM events e
             WHERE e.user_id = ?
             ORDER BY e.created_at DESC'
        );
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
    }
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$row) {
        $row['cover_photo'] = normalizeCoverUrl($row['cover_photo']);
    }
    echo json_encode($rows);
    exit;
}

// ── POST create event ─────────────────────────────────────────────────────────
if ($method === 'POST') {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $data        = json_decode(file_get_contents('php://input'), true);
    $eventType   = trim($data['event_type']    ?? 'wedding');
    $customTitle = trim($data['custom_title'] ?? '');
    $bride       = trim($data['bride_name']    ?? '');
    $groom       = trim($data['groom_name']    ?? '');
    $birthdayName = trim($data['birthday_person_name'] ?? '');
    $birthdayAge  = intval($data['birthday_person_age'] ?? 0);
    $parent1     = trim($data['parent1_name'] ?? '');
    $parent2     = trim($data['parent2_name'] ?? '');
    $mother      = trim($data['mother_name'] ?? '');
    $father      = trim($data['father_name'] ?? '');
    $host        = trim($data['host_name'] ?? '');
    $spouse      = trim($data['spouse_name'] ?? '');
    $date        = $data['wedding_date']        ?? '';
    $venue       = trim($data['venue']          ?? '');
    $city        = trim($data['city']           ?? '');
    $venueLat    = $data['venue_latitude'] !== '' && $data['venue_latitude'] !== null ? floatval($data['venue_latitude']) : null;
    $venueLng    = $data['venue_longitude'] !== '' && $data['venue_longitude'] !== null ? floatval($data['venue_longitude']) : null;
    $description = trim($data['description']   ?? '');
    $eventMode   = in_array($data['event_mode'] ?? '', ['past', 'new']) ? $data['event_mode'] : 'new';
    $approvalStatus = $eventMode === 'past' ? 'approved' : 'pending';

    if ($date) {
        $today = date('Y-m-d');
        if ($eventMode === 'past' && $date > $today) {
            http_response_code(400);
            echo json_encode(['error' => 'Past events must have a date on or before today']);
            exit;
        }
        if ($eventMode === 'new' && $date < $today) {
            http_response_code(400);
            echo json_encode(['error' => 'New events must have today or a future date']);
            exit;
        }
    }

    // Validate event type
    $validTypes = ['wedding', 'birthday', 'engagement', 'valakaappu', 'housewarming', 'graduation', 'custom'];
    if (!in_array($eventType, $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid event type']);
        exit;
    }

    // Validate based on event type
    if ($eventType === 'wedding') {
        if (!$bride || !$groom || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Bride name, groom name and date are required for wedding events']);
            exit;
        }
    } elseif ($eventType === 'birthday') {
        if (!$birthdayName || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Person name and date are required for birthday events']);
            exit;
        }
        // For birthday, use birthday person name as both bride/groom placeholder
        $bride = $birthdayName;
        $groom = $birthdayName;
    } elseif ($eventType === 'custom') {
        if (!$customTitle || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Event title and date are required for custom events']);
            exit;
        }
        $bride = $customTitle;
        $groom = $customTitle;
    } elseif ($eventType === 'graduation') {
        $graduate = trim($data['graduate_name'] ?? '');
        if (!$graduate || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Graduate name and date are required for graduation events']);
            exit;
        }
        $bride = $graduate;
        $groom = $graduate;
    } elseif (in_array($eventType, ['engagement', 'valakaappu', 'housewarming'])) {
        if (!$bride || !$groom || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Names and date are required for this event type']);
            exit;
        }
        // For engagement, also require parent names
        if ($eventType === 'engagement' && (!$parent1 || !$parent2 || !$mother || !$father)) {
            http_response_code(400);
            echo json_encode(['error' => 'Parent 1, Parent 2, Mother and Father names are required for engagement events']);
            exit;
        }
        // For housewarming, also require host and spouse names
        if ($eventType === 'housewarming' && (!$host || !$spouse)) {
            http_response_code(400);
            echo json_encode(['error' => 'Host and Spouse names are required for housewarming events']);
            exit;
        }
    }

    $slug = generateSlug($eventType, $date);
    $db   = getDB();
    
    // Build types and values dynamically to handle null values
    $types = 'i';
    $values = [$user['id']];
    $types .= 's';
    $values[] = $slug;
    $types .= 's';
    $values[] = $eventType;
    $types .= 's';
    $values[] = $customTitle;
    $types .= 's';
    $values[] = $bride;
    $types .= 's';
    $values[] = $groom;
    $types .= 's';
    $values[] = $birthdayName;
    $types .= 'i';
    $values[] = $birthdayAge;
    $types .= 's';
    $values[] = $parent1;
    $types .= 's';
    $values[] = $parent2;
    $types .= 's';
    $values[] = $mother;
    $types .= 's';
    $values[] = $father;
    $types .= 's';
    $values[] = $host;
    $types .= 's';
    $values[] = $spouse;
    $types .= 's';
    $values[] = $graduate ?? '';
    $types .= 's';
    $values[] = $date;
    $types .= 's';
    $values[] = $venue;
    $types .= 's';
    $values[] = $city ?? '';
    $types .= 'd';
    $values[] = $venueLat;
    $types .= 'd';
    $values[] = $venueLng;
    $types .= 's';
    $values[] = $description;
    $types .= 's';
    $values[] = $eventMode;
    $types .= 's';
    $values[] = $approvalStatus;
    
    $stmt = $db->prepare('INSERT INTO events (user_id, slug, event_type, custom_title, bride_name, groom_name, birthday_person_name, birthday_person_age, parent1_name, parent2_name, mother_name, father_name, host_name, spouse_name, graduate_name, wedding_date, venue, city, venue_latitude, venue_longitude, description, event_mode, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    // Use call_user_func_array to handle null values properly
    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
    $stmt->execute();
    $eventId = $db->insert_id;

    echo json_encode([
        'success' => true,
        'id' => $eventId,
        'slug' => $slug,
        'event_mode' => $eventMode,
        'approval_status' => $approvalStatus,
    ]);
    exit;
  }

// ── Admin: Approve/Reject event ───────────────────────────────────────────────
if ($method === 'PUT' && $action === 'approve' && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db = getDB();
    $stmtRole = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmtRole->bind_param('i', $user['id']);
    $stmtRole->execute();
    $roleRow = $stmtRole->get_result()->fetch_assoc();
    if (($roleRow['role'] ?? 'user') !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? 'approved';
    $reason = trim($data['reason'] ?? '');

    if (!in_array($status, ['approved', 'rejected'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        exit;
    }

    if ($status === 'rejected' && $reason === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Rejection reason is required']);
        exit;
    }

    $stmtEv = $db->prepare('SELECT event_mode, guest_token FROM events WHERE id = ?');
    $stmtEv->bind_param('i', $id);
    $stmtEv->execute();
    $evRow = $stmtEv->get_result()->fetch_assoc();

    if ($status === 'approved' && ($evRow['event_mode'] ?? '') === 'new') {
        $newToken = !empty($evRow['guest_token']) ? $evRow['guest_token'] : bin2hex(random_bytes(16));
        $stmt = $db->prepare("UPDATE events SET approval_status = 'approved', approval_reason = NULL, guest_token = ?, qr_enabled = 1 WHERE id = ?");
        $stmt->bind_param('si', $newToken, $id);
        $stmt->execute();
    } else {
        $stmt = $db->prepare('UPDATE events SET approval_status = ?, approval_reason = ? WHERE id = ?');
        $rejectReason = $status === 'rejected' ? $reason : null;
        $stmt->bind_param('ssi', $status, $rejectReason, $id);
        $stmt->execute();
    }

    $stmtOwner = $db->prepare('SELECT user_id, event_type, bride_name, groom_name, custom_title FROM events WHERE id = ?');
    $stmtOwner->bind_param('i', $id);
    $stmtOwner->execute();
    $ownerRow = $stmtOwner->get_result()->fetch_assoc();

    if ($ownerRow) {
        if ($status === 'approved') {
            $title = 'Your function is approved! / உங்கள் செயல்பாடு அனுமதிக்கப்பட்டது!';
            $message = 'You can now add moi entries and share your QR code on invitations. / மொய் பதிவு மற்றும் QR அச்சிடலாம்.';
        } else {
            $title = 'Function Rejected / செயல்பாடு நிராகரிக்கப்பட்டது';
            $message = $reason . ' — Please edit and resubmit. / தயவுசெய்து திருத்தி மீண்டும் சமர்ப்பிக்கவும்.';
        }

        $stmtNotif = $db->prepare('INSERT INTO notifications (user_id, event_id, title, message, type) VALUES (?, ?, ?, ?, ?)');
        $notifType = 'approval';
        $stmtNotif->bind_param('iisss', $ownerRow['user_id'], $id, $title, $message, $notifType);
        $stmtNotif->execute();
    }

    echo json_encode(['success' => true, 'message' => 'Event ' . $status]);
    exit;
}

// ── Host: Close / reopen guest QR payments ────────────────────────────────────
if ($method === 'PUT' && in_array($action, ['close-qr', 'open-qr'], true) && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db = getDB();
    $qrEnabled = $action === 'open-qr' ? 1 : 0;
    $stmt = $db->prepare('UPDATE events SET qr_enabled = ? WHERE id = ? AND user_id = ? AND event_mode = \'new\' AND approval_status = \'approved\'');
    $stmt->bind_param('iii', $qrEnabled, $id, $user['id']);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot update QR status for this function']);
        exit;
    }

    echo json_encode(['success' => true, 'qr_enabled' => $qrEnabled]);
    exit;
}

// ── Host: Regenerate guest QR token ────────────────────────────────────────────
if ($method === 'PUT' && $action === 'regenerate-qr' && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, event_mode, approval_status FROM events WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ii', $id, $user['id']);
    $stmt->execute();
    $ev = $stmt->get_result()->fetch_assoc();

    if (!$ev || $ev['event_mode'] !== 'new' || $ev['approval_status'] !== 'approved') {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot regenerate QR for this function']);
        exit;
    }

    $newToken = bin2hex(random_bytes(16));
    $stmt = $db->prepare('UPDATE events SET guest_token = ? WHERE id = ?');
    $stmt->bind_param('si', $newToken, $id);
    $stmt->execute();

    echo json_encode(['success' => true, 'guest_token' => $newToken]);
    exit;
}

// ── Host: Resubmit rejected event for approval ──────────────────────────────────
if ($method === 'PUT' && $action === 'resubmit' && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, approval_status, event_mode FROM events WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ii', $id, $user['id']);
    $stmt->execute();
    $eventRow = $stmt->get_result()->fetch_assoc();

    if (!$eventRow) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
        exit;
    }

    if ($eventRow['event_mode'] !== 'new') {
        http_response_code(400);
        echo json_encode(['error' => 'Only new events require approval']);
        exit;
    }

    if ($eventRow['approval_status'] !== 'rejected') {
        http_response_code(400);
        echo json_encode(['error' => 'Only rejected events can be resubmitted']);
        exit;
    }

    $stmt = $db->prepare("UPDATE events SET approval_status = 'pending', approval_reason = NULL WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Function resubmitted for approval']);
    exit;
}

// ── PUT update event ──────────────────────────────────────────────────────────
if ($method === 'PUT' && $id && !$action) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $data        = json_decode(file_get_contents('php://input'), true);
    $eventType   = trim($data['event_type']    ?? 'wedding');
    $customTitle = trim($data['custom_title'] ?? '');
    $bride       = trim($data['bride_name']    ?? '');
    $groom       = trim($data['groom_name']    ?? '');
    $birthdayName = trim($data['birthday_person_name'] ?? '');
    $birthdayAge  = intval($data['birthday_person_age'] ?? 0);
    $parent1     = trim($data['parent1_name'] ?? '');
    $parent2     = trim($data['parent2_name'] ?? '');
    $mother      = trim($data['mother_name'] ?? '');
    $father      = trim($data['father_name'] ?? '');
    $host        = trim($data['host_name'] ?? '');
    $spouse      = trim($data['spouse_name'] ?? '');
    $graduate    = trim($data['graduate_name'] ?? '');
    $date        = $data['wedding_date']        ?? '';
    $venue       = trim($data['venue']          ?? '');
    $venueLat    = $data['venue_latitude'] !== '' && $data['venue_latitude'] !== null ? floatval($data['venue_latitude']) : null;
    $venueLng    = $data['venue_longitude'] !== '' && $data['venue_longitude'] !== null ? floatval($data['venue_longitude']) : null;
    $desc        = trim($data['description']   ?? '');

    // Validate event type
    $validTypes = ['wedding', 'birthday', 'engagement', 'valakaappu', 'housewarming', 'graduation', 'custom'];
    if (!in_array($eventType, $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid event type']);
        exit;
    }

    // Validate based on event type
    if ($eventType === 'wedding') {
        if (!$bride || !$groom || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Bride name, groom name and date required for wedding']);
            exit;
        }
    } elseif ($eventType === 'birthday') {
        if (!$birthdayName || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Person name and date required for birthday']);
            exit;
        }
        $bride = $birthdayName;
        $groom = $birthdayName;
    } elseif ($eventType === 'custom') {
        if (!$customTitle || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Event title and date required for custom']);
            exit;
        }
        $bride = $customTitle;
        $groom = $customTitle;
    } elseif ($eventType === 'graduation') {
        $graduate = trim($data['graduate_name'] ?? '');
        if (!$graduate || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Graduate name and date required for graduation']);
            exit;
        }
        $bride = $graduate;
        $groom = $graduate;
    } elseif (in_array($eventType, ['engagement', 'valakaappu', 'housewarming'])) {
        if (!$bride || !$groom || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Names and date required for this event type']);
            exit;
        }
        if ($eventType === 'engagement' && (!$parent1 || !$parent2 || !$mother || !$father)) {
            http_response_code(400);
            echo json_encode(['error' => 'Parent 1, Parent 2, Mother and Father names are required for engagement events']);
            exit;
        }
        if ($eventType === 'housewarming' && (!$host || !$spouse)) {
            http_response_code(400);
            echo json_encode(['error' => 'Host and Spouse names are required for housewarming events']);
            exit;
        }
    }

    $db   = getDB();
    
    // Build types and values dynamically to handle null values
    $types = '';
    $values = [];
    $types .= 's';
    $values[] = $eventType;
    $types .= 's';
    $values[] = $customTitle;
    $types .= 's';
    $values[] = $bride;
    $types .= 's';
    $values[] = $groom;
    $types .= 's';
    $values[] = $birthdayName;
    $types .= 'i';
    $values[] = $birthdayAge;
    $types .= 's';
    $values[] = $parent1;
    $types .= 's';
    $values[] = $parent2;
    $types .= 's';
    $values[] = $mother;
    $types .= 's';
    $values[] = $father;
    $types .= 's';
    $values[] = $host;
    $types .= 's';
    $values[] = $spouse;
    $types .= 's';
    $values[] = $graduate;
    $types .= 's';
    $values[] = $date;
    $types .= 's';
    $values[] = $venue;
    $types .= 'd';
    $values[] = $venueLat;
    $types .= 'd';
    $values[] = $venueLng;
    $types .= 's';
    $values[] = $desc;
    $types .= 'i';
    $values[] = $id;
    $types .= 'i';
    $values[] = $user['id'];
    
    $stmt = $db->prepare('UPDATE events SET event_type=?, custom_title=?, bride_name=?, groom_name=?, birthday_person_name=?, birthday_person_age=?, parent1_name=?, parent2_name=?, mother_name=?, father_name=?, host_name=?, spouse_name=?, graduate_name=?, wedding_date=?, venue=?, venue_latitude=?, venue_longitude=?, description=? WHERE id=? AND user_id=?');
    // Use call_user_func_array to handle null values properly
    $params = array_merge([$types], $values);
    call_user_func_array([$stmt, 'bind_param'], refValues($params));
    $stmt->execute();

    // Auto-resubmit when host edits a rejected new event
    $stmtResubmit = $db->prepare("UPDATE events SET approval_status = 'pending', approval_reason = NULL WHERE id = ? AND user_id = ? AND event_mode = 'new' AND approval_status = 'rejected'");
    $stmtResubmit->bind_param('ii', $id, $user['id']);
    $stmtResubmit->execute();
    $resubmitted = $stmtResubmit->affected_rows > 0;

    echo json_encode(['success' => true, 'resubmitted' => $resubmitted]);
    exit;
}

// ── DELETE event ──────────────────────────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $user = getAuthUser();
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit; }

    $db   = getDB();
    $stmt = $db->prepare('DELETE FROM events WHERE id=? AND user_id=?');
    $stmt->bind_param('ii', $id, $user['id']);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);

function generateSlug(string $eventType, string $date): string {
    $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $eventType));
    return $base . '-' . str_replace('-', '', $date) . '-' . substr(uniqid(), -4);
}
