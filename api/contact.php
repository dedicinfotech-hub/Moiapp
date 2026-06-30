<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];

$name    = trim($data['name'] ?? '');
$email   = trim($data['email'] ?? '');
$phone   = preg_replace('/\D/', '', $data['phone'] ?? '');
$message = trim($data['message'] ?? '');

if ($name === '' || $email === '' || $phone === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

if (!preg_match('/^[0-9]{10}$/', $phone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Phone number must be a valid 10-digit number']);
    exit;
}

$db = getDB();

$db->query('CREATE TABLE IF NOT EXISTS contact_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)');

$stmt = $db->prepare('INSERT INTO contact_enquiries (name, email, phone, message) VALUES (?, ?, ?, ?)');
$stmt->bind_param('ssss', $name, $email, $phone, $message);
$stmt->execute();

echo json_encode([
    'success' => true,
    'message' => 'Your enquiry has been submitted. We will get back to you shortly.',
]);
