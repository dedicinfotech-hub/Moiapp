<?php
// Create admin user script
// Run: php scripts/create_admin.php

require_once __DIR__ . '/../config/bootstrap.php';

use Config\Db;

// Get database connection
$pdo = Db::getConnection();

// Admin user details - change these as needed
$name = 'Admin';
$email = 'admin@moiapp.com';
$password = 'admin123'; // Change this password!
$phone = '0000000000';

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if admin user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo "Admin user already exists with email: $email\n";
        
        // Update to admin role if not already
        $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE email = ?");
        $stmt->execute([$email]);
        echo "Updated user to admin role.\n";
    } else {
        // Create new admin user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'admin')");
        $stmt->execute([$name, $email, $hashedPassword, $phone]);
        echo "Admin user created successfully!\n";
        echo "Email: $email\n";
        echo "Password: $password\n";
    }
    
    echo "\nYou can now log in with these credentials.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}