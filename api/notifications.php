<?php
/**
 * Notifications API - For reminders and alerts
 */
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
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Get user from token
$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $user['id'];
$db = getDB();

try {
    switch ($method) {
        case 'GET':
            // Get all notifications for user
            $page = intval($_GET['page'] ?? $input['page'] ?? 1);
            $limit = 20;
            $offset = ($page - 1) * $limit;
            
            $stmt = $db->prepare("
                SELECT n.*, e.slug as event_name
                FROM notifications n
                LEFT JOIN events e ON n.event_id = e.id
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param('iii', $userId, $limit, $offset);
            $stmt->execute();
            $notifications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Get unread count
            $stmt = $db->prepare("SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0");
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $unreadCount = $stmt->get_result()->fetch_assoc()['unread_count'];
            
            echo json_encode([
                'success' => true,
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]);
            exit;
            
        case 'POST':
            // Create notification
            $title = trim($input['title'] ?? '');
            $message = trim($input['message'] ?? '');
            $type = $input['type'] ?? 'reminder';
            $eventId = $input['event_id'] ?? null;
            $scheduledFor = $input['scheduled_for'] ?? null;
            
            if (empty($title)) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                exit;
            }
            
            $stmt = $db->prepare("
                INSERT INTO notifications (user_id, event_id, title, message, type, scheduled_for) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            // Build types and values dynamically to handle null values
            $types = 'i';
            $values = [$userId];
            $types .= 's';
            $values[] = $eventId;
            $types .= 'ssss';
            $values[] = $title;
            $values[] = $message;
            $values[] = $type;
            $values[] = $scheduledFor;
            $params = array_merge([$types], $values);
            call_user_func_array([$stmt, 'bind_param'], refValues($params));
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification created',
                'id' => $db->insert_id
            ]);
            exit;
            
        case 'PUT':
            // Mark notification as read
            $id = intval($input['id'] ?? 0);
            
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid notification ID']);
                exit;
            }
            
            $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->bind_param('ii', $id, $userId);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
            exit;
            
        case 'DELETE':
            // Delete notification
            $id = intval($input['id'] ?? 0);
            
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid notification ID']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
            $stmt->bind_param('ii', $id, $userId);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Notification deleted']);
            exit;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
    }
} catch (Exception $e) {
    error_log("Notifications API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}