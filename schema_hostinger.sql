-- ─────────────────────────────────────────────────────────────────────────────
-- MoiApp — Hostinger import script
-- DO NOT run CREATE DATABASE here — Hostinger creates it for you.
-- In phpMyAdmin: select u219511699_moiapp → Import → choose this file → Go
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users (event creators / organizers)
CREATE TABLE IF NOT EXISTS users (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL,
    email            VARCHAR(150)  UNIQUE NOT NULL,
    password         VARCHAR(255)  NOT NULL,
    phone            VARCHAR(20),
    upi_id           VARCHAR(100),
    bank_name        VARCHAR(100),
    account_number   VARCHAR(50),
    ifsc_code        VARCHAR(20),
    account_holder   VARCHAR(100),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Run this if the table already exists (adds payment columns):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder VARCHAR(100);

-- Wedding events
CREATE TABLE IF NOT EXISTS events (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    slug         VARCHAR(100) UNIQUE NOT NULL,
    bride_name   VARCHAR(100) NOT NULL,
    groom_name   VARCHAR(100) NOT NULL,
    wedding_date DATE         NOT NULL,
    venue        VARCHAR(255),
    cover_photo  VARCHAR(500),
    description  TEXT,
    is_active    TINYINT(1)   DEFAULT 1,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moi (gift) entries
CREATE TABLE IF NOT EXISTS moi_entries (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id     INT            NOT NULL,
    guest_name   VARCHAR(100)   NOT NULL,
    amount       DECIMAL(10,2)  NOT NULL,
    relation     ENUM('family','friend','colleague','other') DEFAULT 'friend',
    payment_mode ENUM('cash','upi','card','cheque')          DEFAULT 'cash',
    note         TEXT,
    entered_by   VARCHAR(100),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wedding photos (stored on server filesystem)
CREATE TABLE IF NOT EXISTS photos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT          NOT NULL,
    s3_key      VARCHAR(500) NOT NULL,
    s3_url      VARCHAR(500) NOT NULL,
    caption     VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens (future use)
CREATE TABLE IF NOT EXISTS password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(150) NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
