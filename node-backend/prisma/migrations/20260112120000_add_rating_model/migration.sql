-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `rating_id` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `ratings` (
    `id` VARCHAR(255) NOT NULL,
    `booking_id` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(255) NOT NULL,
    `driver_id` VARCHAR(255) NOT NULL,
    `rating` INT NOT NULL,
    `review` LONGTEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ratings_booking_id_unique`(`booking_id`),
    INDEX `ratings_customer_id_index`(`customer_id`),
    INDEX `ratings_driver_id_index`(`driver_id`),
    INDEX `ratings_booking_id_index`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
