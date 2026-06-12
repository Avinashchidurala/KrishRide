-- CreateTable
CREATE TABLE `service_states` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(2) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `service_states_name_key`(`name`),
    UNIQUE INDEX `service_states_code_key`(`code`),
    INDEX `service_states_is_active_index`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default states
INSERT INTO `service_states` (`id`, `name`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('state-ap', 'Andhra Pradesh', 'AP', 'Andhra Pradesh - Service available', true, NOW(), NOW()),
('state-tg', 'Telangana', 'TG', 'Telangana - Service available', true, NOW(), NOW()),
('state-ka', 'Karnataka', 'KA', 'Karnataka - Service available', true, NOW(), NOW()),
('state-tn', 'Tamil Nadu', 'TN', 'Tamil Nadu - Service available', true, NOW(), NOW());
