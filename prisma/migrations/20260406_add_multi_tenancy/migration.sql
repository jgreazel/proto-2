-- Migration: Add Multi-Tenancy Support
-- This migration adds Organization, OrganizationMembership tables
-- and adds organizationId to all core business tables.
-- It also creates a default "Audubon Pool" organization and backfills existing data.

-- ============================================================
-- Step 1: Create Organization table
-- ============================================================
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `stripeCustomerId` VARCHAR(191) NULL,
    `subscriptionStatus` VARCHAR(30) NOT NULL DEFAULT 'trialing',

    UNIQUE INDEX `Organization_slug_key`(`slug`),
    UNIQUE INDEX `Organization_stripeCustomerId_key`(`stripeCustomerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- Step 2: Create OrganizationMembership table
-- ============================================================
CREATE TABLE `OrganizationMembership` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `displayName` VARCHAR(255) NOT NULL,
    `pin` VARCHAR(10) NULL,
    `isPinOnly` BOOLEAN NOT NULL DEFAULT false,
    `isSystemAccount` BOOLEAN NOT NULL DEFAULT false,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `role` VARCHAR(20) NOT NULL DEFAULT 'staff',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrganizationMembership_organizationId_pin_key`(`organizationId`, `pin`),
    UNIQUE INDEX `OrganizationMembership_organizationId_userId_key`(`organizationId`, `userId`),
    INDEX `OrganizationMembership_organizationId_idx`(`organizationId`),
    INDEX `OrganizationMembership_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- Step 3: Add organizationId column to all core tables
-- ============================================================
ALTER TABLE `InventoryItem` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `Category` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `SeasonPass` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `Patron` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `Transaction` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `AdmissionEvent` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `Shift` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `Feedback` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `HourCode` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `TimeClockEvent` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `ItemChangeLog` ADD COLUMN `organizationId` VARCHAR(191) NULL;
ALTER TABLE `SavedReport` ADD COLUMN `organizationId` VARCHAR(191) NULL;

-- ============================================================
-- Step 4: Add indexes on organizationId for all tables
-- ============================================================
CREATE INDEX `InventoryItem_organizationId_idx` ON `InventoryItem`(`organizationId`);
CREATE INDEX `Category_organizationId_idx` ON `Category`(`organizationId`);
CREATE INDEX `SeasonPass_organizationId_idx` ON `SeasonPass`(`organizationId`);
CREATE INDEX `Patron_organizationId_idx` ON `Patron`(`organizationId`);
CREATE INDEX `Transaction_organizationId_idx` ON `Transaction`(`organizationId`);
CREATE INDEX `AdmissionEvent_organizationId_idx` ON `AdmissionEvent`(`organizationId`);
CREATE INDEX `Shift_organizationId_idx` ON `Shift`(`organizationId`);
CREATE INDEX `Feedback_organizationId_idx` ON `Feedback`(`organizationId`);
CREATE INDEX `HourCode_organizationId_idx` ON `HourCode`(`organizationId`);
CREATE INDEX `TimeClockEvent_organizationId_idx` ON `TimeClockEvent`(`organizationId`);
CREATE INDEX `ItemChangeLog_organizationId_idx` ON `ItemChangeLog`(`organizationId`);
CREATE INDEX `SavedReport_organizationId_idx` ON `SavedReport`(`organizationId`);

-- ============================================================
-- Step 5: Create the default Audubon Pool organization
-- and backfill ALL existing rows with its ID
-- ============================================================
-- NOTE: Replace the cuid below with a real generated one, or use a fixed known ID.
-- Using a deterministic ID so this migration is idempotent.

INSERT INTO `Organization` (`id`, `name`, `slug`, `subscriptionStatus`)
VALUES ('org_audubon_pool', 'Audubon Community Pool', 'audubon-pool', 'active');

-- Backfill all existing data to belong to the Audubon org
UPDATE `InventoryItem` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `Category` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `SeasonPass` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `Patron` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `Transaction` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `AdmissionEvent` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `Shift` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `Feedback` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `HourCode` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `TimeClockEvent` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `ItemChangeLog` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;
UPDATE `SavedReport` SET `organizationId` = 'org_audubon_pool' WHERE `organizationId` IS NULL;

-- ============================================================
-- Step 6: Create OrganizationMembership rows from existing UserSettings
-- Maps: isAdmin=true → role='owner', isAdmin=false → role='staff'
-- Copies clockPIN to membership pin field
-- ============================================================
INSERT INTO `OrganizationMembership` (`id`, `organizationId`, `userId`, `displayName`, `pin`, `isPinOnly`, `isSystemAccount`, `isAdmin`, `role`)
SELECT
    CONCAT('mem_', `id`),
    'org_audubon_pool',
    `userId`,
    `userId`,
    `clockPIN`,
    false,
    false,
    `isAdmin`,
    CASE WHEN `isAdmin` = true THEN 'owner' ELSE 'staff' END
FROM `UserSettings`;
