-- Migration: Fix TimeClockEvent schema discrepancy in production
--
-- Root cause: The production DB was set up when hourCodeId was NOT NULL.
-- Commit b408a20 ("add time card") changed hourCodeId to String? (nullable),
-- but the production DB was never updated — causing a null constraint
-- violation whenever a clock event was created without an hourCodeId.
--
-- This migration brings prod in line with the current Prisma schema.
--
-- Note: userId @unique was also investigated; it does NOT exist in prod
-- (was never promoted to the prod branch), so no index drop is needed.

-- ============================================================
-- Make hourCodeId nullable (was VARCHAR(191) NOT NULL, now String?)
-- ============================================================
ALTER TABLE `TimeClockEvent` MODIFY COLUMN `hourCodeId` VARCHAR(191) NULL;

