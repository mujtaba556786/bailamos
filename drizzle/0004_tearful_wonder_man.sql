CREATE TABLE `reservation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`reservation_id` text NOT NULL,
	`previous_status` text,
	`status` text NOT NULL,
	`actor` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`version` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reservation_events_reservation` ON `reservation_events` (`reservation_id`,`version`);--> statement-breakpoint
ALTER TABLE `reservations` ADD `booking_key_hash` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `booking_payload_hash` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `duplicate_fingerprint` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `starts_at` integer;--> statement-breakpoint
ALTER TABLE `reservations` ADD `ends_at` integer;--> statement-breakpoint
ALTER TABLE `reservations` ADD `version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `updated_by` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `change_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `newsletter_opt_in` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `newsletter_consent_at` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `newsletter_synced_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reservations_booking_key` ON `reservations` (`booking_key_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reservations_active_duplicate` ON `reservations` (`duplicate_fingerprint`) WHERE "reservations"."status" IN ('pending', 'confirmed', 'arrived', 'seated');--> statement-breakpoint
CREATE INDEX `idx_reservations_resource_interval` ON `reservations` (`table_id`,`starts_at`,`ends_at`);
