-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `age` INTEGER NOT NULL,
    `gender` VARCHAR(50) NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `is_phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `profile_completed` BOOLEAN NOT NULL DEFAULT false,
    `last_login` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `profile_photo_url` TEXT NULL,
    `auth_provider` VARCHAR(50) NOT NULL DEFAULT 'otp',
    `provider_id` VARCHAR(255) NULL,
    `fcm_token` TEXT NULL,
    `web_push_subscription` TEXT NULL,

    UNIQUE INDEX `users_mobile_unique`(`mobile`),
    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `is_driver_approved` BOOLEAN NULL DEFAULT false,
    `license_number` VARCHAR(100) NULL,
    `license_expiry` DATETIME(0) NULL,
    `total_rides` INTEGER NULL DEFAULT 0,
    `completed_rides` INTEGER NULL DEFAULT 0,
    `total_earnings` DECIMAL(10, 2) NULL DEFAULT 0,
    `wallet_balance` DECIMAL(10, 2) NULL DEFAULT 0,
    `average_rating` DECIMAL(3, 2) NULL DEFAULT 0,
    `total_ratings` INTEGER NULL DEFAULT 0,
    `bank_name` VARCHAR(255) NULL,
    `bank_ifsc_code` VARCHAR(20) NULL,
    `bank_account_number` VARCHAR(50) NULL,
    `aadhar_number` VARCHAR(20) NULL,
    `pan_number` VARCHAR(20) NULL,
    `kyc_documents` JSON NULL,
    `selfie_url` TEXT NULL,
    `kyc_verified_at` DATETIME(0) NULL,
    `kyc_expires_at` DATETIME(0) NULL,
    `kyc_status` VARCHAR(50) NULL DEFAULT 'pending',
    `kyc_submitted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `drivers_user_id_unique`(`user_id`),
    INDEX `drivers_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `preferences` JSON NULL,
    `total_bookings` INTEGER NULL DEFAULT 0,
    `completed_bookings` INTEGER NULL DEFAULT 0,
    `cancelled_bookings` INTEGER NULL DEFAULT 0,
    `average_rating` DECIMAL(3, 2) NULL DEFAULT 0,
    `total_ratings` INTEGER NULL DEFAULT 0,
    `loyalty_points` INTEGER NULL DEFAULT 0,
    `wallet_balance` DECIMAL(10, 2) NULL DEFAULT 0,
    `drop_pin` VARCHAR(10) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `customers_user_id_unique`(`user_id`),
    INDEX `customers_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `permissions` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `admins_user_id_unique`(`user_id`),
    INDEX `admins_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(255) NOT NULL,
    `driver_id` VARCHAR(255) NOT NULL,
    `vehicle_make` VARCHAR(100) NULL,
    `vehicle_model` VARCHAR(100) NULL,
    `vehicle_year` INTEGER NULL,
    `vehicle_color` VARCHAR(50) NULL,
    `vehicle_plate_number` VARCHAR(50) NULL,
    `vehicle_registration_number` VARCHAR(100) NULL,
    `vehicle_registration_document` TEXT NULL,
    `vehicle_insurance_expiry` DATETIME(0) NULL,
    `inside_photos` JSON NULL,
    `outside_photos` JSON NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `vehicles_driver_id_index`(`driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_verifications` (
    `id` VARCHAR(255) NOT NULL,
    `driver_id` VARCHAR(255) NOT NULL,
    `document_type` VARCHAR(50) NOT NULL,
    `document_number` VARCHAR(100) NULL,
    `document_url` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `verified_at` DATETIME(0) NULL,
    `expires_at` DATETIME(0) NULL,
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `driver_verifications_driver_id_index`(`driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rides` (
    `id` VARCHAR(255) NOT NULL,
    `driver_id` VARCHAR(255) NOT NULL,
    `vehicle_id` VARCHAR(255) NULL,
    `start_location` VARCHAR(255) NOT NULL,
    `end_location` VARCHAR(255) NOT NULL,
    `start_latitude` DECIMAL(10, 8) NULL,
    `start_longitude` DECIMAL(10, 8) NULL,
    `end_latitude` DECIMAL(10, 8) NULL,
    `end_longitude` DECIMAL(10, 8) NULL,
    `scheduled_time` DATETIME(0) NOT NULL,
    `seats_available` INTEGER NOT NULL DEFAULT 1,
    `seats_booked` INTEGER NOT NULL DEFAULT 0,
    `base_fare` DECIMAL(10, 2) NOT NULL,
    `per_km_rate` DECIMAL(10, 2) NOT NULL,
    `price_per_seat` DECIMAL(10, 2) NULL,
    `total_price` DECIMAL(10, 2) NULL,
    `distance_km` DECIMAL(10, 2) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `is_surge` BOOLEAN NOT NULL DEFAULT false,
    `surge_multiplier` DECIMAL(3, 2) NULL DEFAULT 1.0,
    `route_polyline` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `last_active_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rides_driver_id_idx`(`driver_id`),
    INDEX `rides_status_idx`(`status`),
    INDEX `rides_scheduled_time_idx`(`scheduled_time`),
    INDEX `rides_seats_booked_idx`(`seats_booked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(255) NOT NULL,
    `booking_number` VARCHAR(50) NOT NULL,
    `ride_id` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(255) NOT NULL,
    `passengerCount` INTEGER NOT NULL DEFAULT 1,
    `back_seat_count` INTEGER NOT NULL DEFAULT 0,
    `pickup_location` VARCHAR(255) NULL,
    `pickup_latitude` DECIMAL(10, 8) NULL,
    `pickup_longitude` DECIMAL(10, 8) NULL,
    `drop_location` VARCHAR(255) NULL,
    `drop_latitude` DECIMAL(10, 8) NULL,
    `drop_longitude` DECIMAL(10, 8) NULL,
    `base_fare` DECIMAL(10, 2) NOT NULL,
    `platform_fee` DECIMAL(10, 2) NOT NULL DEFAULT 10,
    `service_tax` DECIMAL(10, 2) NULL,
    `driver_fee` DECIMAL(10, 2) NOT NULL DEFAULT 20,
    `total_fare` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `payment_method` VARCHAR(50) NULL,
    `utr_number` VARCHAR(100) NULL,
    `pickup_otp` VARCHAR(10) NULL,
    `drop_pin` VARCHAR(10) NULL,
    `pickup_verified` BOOLEAN NOT NULL DEFAULT false,
    `drop_verified` BOOLEAN NOT NULL DEFAULT false,
    `invoice_url` VARCHAR(191) NULL,
    `invoice_sent_email` BOOLEAN NOT NULL DEFAULT false,
    `invoice_sent_whatsapp` BOOLEAN NOT NULL DEFAULT false,
    `invoice_sent_sms` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_booking_number_key`(`booking_number`),
    INDEX `bookings_ride_id_idx`(`ride_id`),
    INDEX `bookings_customer_id_idx`(`customer_id`),
    INDEX `bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `transaction_type` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `booking_id` VARCHAR(255) NULL,
    `subscription_id` VARCHAR(255) NULL,
    `referral_id` VARCHAR(255) NULL,
    `valid_till` DATETIME(0) NULL,
    `is_expired` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `wallet_transactions_customer_id_index`(`customer_id`),
    INDEX `wallet_transactions_valid_till_index`(`valid_till`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(255) NOT NULL,
    `plan_type` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `cashback_per_trip` DECIMAL(10, 2) NOT NULL,
    `max_benefit` DECIMAL(10, 2) NOT NULL,
    `validity_days` INTEGER NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `expires_at` DATETIME(0) NOT NULL,
    `total_cashback_received` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `subscriptions_customer_id_index`(`customer_id`),
    INDEX `subscriptions_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` VARCHAR(255) NOT NULL,
    `referrer_id` VARCHAR(255) NOT NULL,
    `referee_id` VARCHAR(255) NULL,
    `referral_code` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 100,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `valid_till` DATETIME(0) NOT NULL,
    `credited_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `referrals_referee_id_unique`(`referee_id`),
    UNIQUE INDEX `referrals_referral_code_unique`(`referral_code`),
    INDEX `referrals_referrer_id_index`(`referrer_id`),
    INDEX `referrals_referee_id_index`(`referee_id`),
    INDEX `referrals_referral_code_index`(`referral_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_addresses` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `customer_id` VARCHAR(255) NULL,
    `address_type` VARCHAR(50) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(10, 8) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `saved_addresses_user_id_index`(`user_id`),
    INDEX `saved_addresses_customer_id_index`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `relationship` VARCHAR(50) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `emergency_contacts_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sos_alerts` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `booking_id` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(10, 8) NOT NULL,
    `address` VARCHAR(255) NULL,
    `message` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `sos_alerts_user_id_index`(`user_id`),
    INDEX `sos_alerts_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `booking_id` VARCHAR(255) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `complaints_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `booking_id` VARCHAR(255) NULL,
    `ride_id` VARCHAR(255) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` VARCHAR(50) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    `assigned_to` VARCHAR(255) NULL,
    `created_by_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `support_tickets_user_id_index`(`user_id`),
    INDEX `support_tickets_status_index`(`status`),
    INDEX `support_tickets_booking_id_index`(`booking_id`),
    INDEX `support_tickets_ride_id_index`(`ride_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payouts` (
    `id` VARCHAR(255) NOT NULL,
    `driver_id` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payout_method` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `transaction_id` VARCHAR(255) NULL,
    `processed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `payouts_driver_id_index`(`driver_id`),
    INDEX `payouts_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `revoked_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_user_id_index`(`user_id`),
    INDEX `refresh_tokens_token_index`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_sessions` (
    `id` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `last_message_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `chat_sessions_customer_id_index`(`customer_id`),
    INDEX `chat_sessions_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(255) NOT NULL,
    `session_id` VARCHAR(255) NOT NULL,
    `sender_id` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `chat_messages_session_id_index`(`session_id`),
    INDEX `chat_messages_sender_id_index`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `related_id` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `notifications_user_id_index`(`user_id`),
    INDEX `notifications_read_index`(`read`),
    INDEX `notifications_type_index`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `driver_verifications` ADD CONSTRAINT `driver_verifications_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ride_id_fkey` FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_referral_id_fkey` FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrer_id_fkey` FOREIGN KEY (`referrer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referee_id_fkey` FOREIGN KEY (`referee_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `saved_addresses` ADD CONSTRAINT `saved_addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `saved_addresses` ADD CONSTRAINT `saved_addresses_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sos_alerts` ADD CONSTRAINT `sos_alerts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_ride_id_fkey` FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `chat_sessions` ADD CONSTRAINT `chat_sessions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
