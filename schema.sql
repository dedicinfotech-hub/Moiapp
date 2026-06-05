CREATE DATABASE IF NOT EXISTS moiapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moiapp;

-- Users (event creators)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    upi_id VARCHAR(100),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    account_holder VARCHAR(100),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    event_type ENUM('wedding', 'birthday', 'engagement', 'valakaappu', 'housewarming', 'custom') NOT NULL DEFAULT 'wedding',
    custom_title VARCHAR(100),
    bride_name VARCHAR(100),
    groom_name VARCHAR(100),
    birthday_person_name VARCHAR(100),
    birthday_person_age INT,
    parent1_name VARCHAR(100),
    parent2_name VARCHAR(100),
    mother_name VARCHAR(100),
    father_name VARCHAR(100),
    host_name VARCHAR(100),
    spouse_name VARCHAR(100),
    wedding_date DATE NOT NULL,
    venue VARCHAR(255),
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    cover_photo VARCHAR(500),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Moi entries (gift records)
CREATE TABLE IF NOT EXISTS moi_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    city VARCHAR(150) NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gift_type ENUM('cash','gold','gift') NOT NULL DEFAULT 'cash',
    gold_weight DECIMAL(10,2) NULL,
    gift_description VARCHAR(255) NULL,
    relation ENUM('family','friend','colleague','other') DEFAULT 'friend',
    payment_mode ENUM('cash','upi','card','cheque') DEFAULT 'cash',
    note TEXT,
    entered_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    s3_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event Organizers (multi-user access)
CREATE TABLE IF NOT EXISTS event_organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('organizer', 'admin') NOT NULL DEFAULT 'organizer',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_organizer (event_id, user_id)
);

-- Feature toggles (admin only)
CREATE TABLE IF NOT EXISTS feature_toggles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
