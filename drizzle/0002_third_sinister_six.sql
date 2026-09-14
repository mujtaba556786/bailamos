ALTER TABLE `reservations` ADD `cancel_token` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_reservations_cancel_token` ON `reservations` (`cancel_token`);