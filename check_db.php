<?php
require_once __DIR__ . '/config/bootstrap.php';

$db = getDB();
$result = $db->query("DESCRIBE users");
echo "Users table columns:\n";
while ($row = $result->fetch_assoc()) {
    echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
}