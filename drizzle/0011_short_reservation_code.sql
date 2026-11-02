ALTER TABLE `reservations` ADD `short_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reservations_short_code` ON `reservations` (`short_code`);
