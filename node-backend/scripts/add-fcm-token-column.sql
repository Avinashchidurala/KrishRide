-- Script to add fcm_token column to users table
-- Run this manually using: mysql -h [host] -u [user] -p [database] < add-fcm-token-column.sql
-- Or execute via MySQL client

-- Check if column exists first (optional - MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- If column already exists, you'll get an error - that's fine, it means migration already applied

ALTER TABLE `users` 
ADD COLUMN `fcm_token` TEXT NULL AFTER `provider_id`;

