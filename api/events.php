<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

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
        'SELECT e.id, e.slug, e.event_type, e.bride_name, e.groom_name,
                e.birthday_person_name, e.birthday_person_age, e.parent1_name, e.parent2_name,
                e.mother_name, e.father_name, e.host_name, e.spouse_name,
                e.wedding_date, e.venue,
                e.cover_photo, e.description, e.created_at,
                u.name as creator_name,
                (SELECT COUNT(*) FROM moi_entries WHERE event_id = e.id) as guest_count,
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi
         FROM events e
         JOIN users u ON e.user_id = u.id
         WHERE e.is_active = 1
         ORDER BY e.wedding_date ASC'
    );
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$row) {
        $row['cover_photo'] = normalizeCoverUrl($row['cover_photo']);
    }
    echo json_encode($rows);
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
    $stmt2 = $db->prepare('SELECT COUNT(*) as guest_count, COALESCE(SUM(amount),0) as total FROM moi_entries WHERE event_id = ?');
    $stmt2->bind_param('i', $event['id']);
    $stmt2->execute();
    $event['stats'] = $stmt2->get_result()->fetch_assoc();

    echo json_encode($event);
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
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi
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
                (SELECT COALESCE(SUM(amount),0) FROM moi_entries WHERE event_id = e.id) as total_moi
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
    $venueLat    = $data['venue_latitude'] !== '' && $data['venue_latitude'] !== null ? floatval($data['venue_latitude']) : null;
    $venueLng    = $data['venue_longitude'] !== '' && $data['venue_longitude'] !== null ? floatval($data['venue_longitude']) : null;
    $description = trim($data['description']   ?? '');

    // Validate event type
    $validTypes = ['wedding', 'birthday', 'engagement', 'valakaappu', 'housewarming', 'custom'];
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

    $slug = generateSlug($bride, $groom, $date);
    $db   = getDB();
    $stmt = $db->prepare('INSERT INTO events (user_id, slug, event_type, custom_title, bride_name, groom_name, birthday_person_name, birthday_person_age, parent1_name, parent2_name, mother_name, father_name, host_name, spouse_name, wedding_date, venue, venue_latitude, venue_longitude, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('issssssssssssssdss', $user['id'], $slug, $eventType, $customTitle, $bride, $groom, $birthdayName, $birthdayAge, $parent1, $parent2, $mother, $father, $host, $spouse, $date, $venue, $venueLat, $venueLng, $description);
    $stmt->execute();
    $eventId = $db->insert_id;

    echo json_encode(['success' => true, 'id' => $eventId, 'slug' => $slug]);
    exit;
}

// ── PUT update event ──────────────────────────────────────────────────────────
if ($method === 'PUT' && $id) {
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
    $venueLat    = $data['venue_latitude'] !== '' && $data['venue_latitude'] !== null ? floatval($data['venue_latitude']) : null;
    $venueLng    = $data['venue_longitude'] !== '' && $data['venue_longitude'] !== null ? floatval($data['venue_longitude']) : null;
    $desc        = trim($data['description']   ?? '');

    // Validate event type
    $validTypes = ['wedding', 'birthday', 'engagement', 'valakaappu', 'housewarming', 'custom'];
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
    $stmt = $db->prepare('UPDATE events SET event_type=?, custom_title=?, bride_name=?, groom_name=?, birthday_person_name=?, birthday_person_age=?, parent1_name=?, parent2_name=?, mother_name=?, father_name=?, host_name=?, spouse_name=?, wedding_date=?, venue=?, venue_latitude=?, venue_longitude=?, description=? WHERE id=? AND user_id=?');
    $stmt->bind_param('sssssssssssssdsssi', $eventType, $customTitle, $bride, $groom, $birthdayName, $birthdayAge, $parent1, $parent2, $mother, $father, $host, $spouse, $date, $venue, $venueLat, $venueLng, $desc, $id, $user['id']);
    $stmt->execute();
    echo json_encode(['success' => true]);
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

function generateSlug(string $bride, string $groom, string $date): string {
    $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $bride . $groom));
    return $base . '-' . str_replace('-', '', $date) . '-' . substr(uniqid(), -4);
}
