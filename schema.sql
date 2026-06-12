CREATE DATABASE IF NOT EXISTS moiapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moiapp;

-- Users (event creators)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    otp_code VARCHAR(6),
    otp_expires TIMESTAMP NULL,
    otp_attempts INT DEFAULT 0,
    otp_blocked_until TIMESTAMP NULL,
    is_blocked TINYINT(1) DEFAULT 0,
    is_premium TINYINT(1) DEFAULT 0,
    upi_id VARCHAR(100),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    account_holder VARCHAR(100),
    role ENUM('admin', 'user') DEFAULT 'user',
    login_attempts INT DEFAULT 0,
    login_blocked_until TIMESTAMP NULL,
    admin_otp VARCHAR(6),
    admin_otp_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    event_type ENUM('wedding', 'birthday', 'engagement', 'valakaappu', 'housewarming', 'graduation', 'custom') NOT NULL DEFAULT 'wedding',
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
    graduate_name VARCHAR(100),
    wedding_date DATE NOT NULL,
    venue VARCHAR(255),
    city VARCHAR(100),
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    cover_photo VARCHAR(500),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    -- Event mode: past (record keeping only) or new (live moi collection)
    event_mode ENUM('past', 'new') DEFAULT 'new',
    -- Approval status: pending, approved, rejected
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    approval_reason TEXT,
    guest_token VARCHAR(64) UNIQUE,
    qr_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Moi entries (gift records)
CREATE TABLE IF NOT EXISTS moi_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    city VARCHAR(150) NULL,
    company VARCHAR(100) NULL,
    occupation VARCHAR(100) NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gift_type ENUM('cash','gold','silver','gift') NOT NULL DEFAULT 'cash',
    gold_weight DECIMAL(10,2) NULL,
    gift_description VARCHAR(255) NULL,
    approximate_value DECIMAL(10,2) NULL,
    relation ENUM('family','friend','colleague','relative','neighbor','business','other') DEFAULT 'friend',
    payment_mode ENUM('cash','upi','card','cheque','other') DEFAULT 'cash',
    upi_ref_id VARCHAR(100) NULL,
    other_payment_details VARCHAR(255) NULL,
    note         TEXT,
    entered_by   VARCHAR(100),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- Invitations (for tracking attendance)
CREATE TABLE IF NOT EXISTS invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    relation ENUM('family','friend','colleague','relative','neighbor','business','other') DEFAULT 'friend',
    city VARCHAR(100),
    status ENUM('invited', 'came', 'gave_moi', 'no_show') DEFAULT 'invited',
    moi_entry_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (moi_entry_id) REFERENCES moi_entries(id) ON DELETE SET NULL
);

-- Notifications (for reminders)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('reminder', 'entry_saved', 'return_gift', 'function_date', 'approval') DEFAULT 'reminder',
    is_read TINYINT(1) DEFAULT 0,
    scheduled_for TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Return Gifts (for tracking return gifts)
CREATE TABLE IF NOT EXISTS return_gifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    moi_entry_id INT NULL,
    guest_name VARCHAR(100) NOT NULL,
    return_type ENUM('cash', 'gold', 'gift', 'none') DEFAULT 'none',
    return_amount DECIMAL(10,2) NULL,
    return_gold_weight DECIMAL(10,2) NULL,
    return_gift_description VARCHAR(255) NULL,
    return_date DATE NULL,
    status ENUM('pending', 'returned', 'not_applicable') DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (moi_entry_id) REFERENCES moi_entries(id) ON DELETE SET NULL
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

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    archived_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
