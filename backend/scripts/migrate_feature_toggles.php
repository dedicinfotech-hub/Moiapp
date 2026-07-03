<?php
require_once __DIR__ . '/../config/bootstrap.php';
$db = getDB();

// Check if table exists
$tableExists = $db->query("SHOW TABLES LIKE 'feature_toggles'")->num_rows > 0;

if (!$tableExists) {
    $db->query("
      CREATE TABLE feature_toggles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feature_key VARCHAR(100) NOT NULL UNIQUE,
        is_enabled TINYINT(1) NOT NULL DEFAULT 1,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Created feature_toggles table\n";
} else {
    echo "feature_toggles table already exists\n";
}

$defaults = [
  ['upi_payment', 1, 'Enable UPI payment flow with deep link'],
  ['bulk_import', 1, 'Enable bulk import of old moi notes'],
  ['multi_organizer', 1, 'Enable multi-organizer support'],
  ['pdf_export', 1, 'Enable PDF export via email'],
  ['whatsapp_share', 1, 'Enable WhatsApp thank you share'],
  ['qr_payment', 1, 'Enable QR code payment'],
];

$stmt = $db->prepare("INSERT IGNORE INTO feature_toggles (feature_key, is_enabled, description) VALUES (?, ?, ?)");
foreach ($defaults as $d) {
  $stmt->bind_param('sis', $d[0], $d[1], $d[2]);
  $stmt->execute();
}

echo "Feature toggles defaults inserted.\n";
