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
--> statement-breakpoint
CREATE TRIGGER reservations_overlap_insert BEFORE INSERT ON reservations
WHEN NEW.status IN ('pending','confirmed','arrived','seated')
BEGIN
 SELECT CASE WHEN EXISTS (
 SELECT 1 FROM reservations r WHERE r.id != NEW.id AND r.table_id = NEW.table_id
 AND r.status IN ('pending','confirmed','arrived','seated') AND (
 (r.starts_at IS NOT NULL AND NEW.starts_at IS NOT NULL AND r.starts_at < NEW.ends_at AND NEW.starts_at < r.ends_at)
 OR ((r.starts_at IS NULL OR NEW.starts_at IS NULL)
 AND julianday(r.date || ' ' || r.time) < julianday(NEW.date || ' ' || NEW.time) + NEW.duration_minutes / 1440.0
 AND julianday(NEW.date || ' ' || NEW.time) < julianday(r.date || ' ' || r.time) + r.duration_minutes / 1440.0)
 )) THEN RAISE(ABORT,'BOOKING_OVERLAP') END;
END;
--> statement-breakpoint
CREATE TRIGGER reservations_overlap_update BEFORE UPDATE ON reservations
WHEN NEW.status IN ('pending','confirmed','arrived','seated')
BEGIN
 SELECT CASE WHEN EXISTS (
 SELECT 1 FROM reservations r WHERE r.id != NEW.id AND r.table_id = NEW.table_id
 AND r.status IN ('pending','confirmed','arrived','seated') AND (
 (r.starts_at IS NOT NULL AND NEW.starts_at IS NOT NULL AND r.starts_at < NEW.ends_at AND NEW.starts_at < r.ends_at)
 OR ((r.starts_at IS NULL OR NEW.starts_at IS NULL)
 AND julianday(r.date || ' ' || r.time) < julianday(NEW.date || ' ' || NEW.time) + NEW.duration_minutes / 1440.0
 AND julianday(NEW.date || ' ' || NEW.time) < julianday(r.date || ' ' || r.time) + r.duration_minutes / 1440.0)
 )) THEN RAISE(ABORT,'BOOKING_OVERLAP') END;
END;
--> statement-breakpoint
CREATE TRIGGER reservations_state_guard BEFORE UPDATE OF status ON reservations
WHEN NEW.status != OLD.status
BEGIN
 SELECT CASE WHEN NEW.version != OLD.version + 1 THEN RAISE(ABORT,'BOOKING_VERSION') END;
 SELECT CASE WHEN NOT (
 (OLD.status = 'pending' AND NEW.status IN ('confirmed','declined','cancelled')) OR
 (OLD.status = 'confirmed' AND NEW.status IN ('arrived','cancelled','no_show')) OR
 (OLD.status = 'arrived' AND NEW.status IN ('seated','cancelled','no_show')) OR
 (OLD.status = 'seated' AND NEW.status = 'completed')
 ) THEN RAISE(ABORT,'BOOKING_TRANSITION') END;
END;
--> statement-breakpoint
CREATE TRIGGER reservations_event_insert AFTER INSERT ON reservations BEGIN
 INSERT INTO reservation_events (id,reservation_id,previous_status,status,actor,reason,version,created_at)
 VALUES (NEW.id || ':' || NEW.version,NEW.id,NULL,NEW.status,NEW.updated_by,NEW.change_reason,NEW.version,NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER reservations_event_update AFTER UPDATE OF status ON reservations WHEN NEW.status != OLD.status BEGIN
 INSERT INTO reservation_events (id,reservation_id,previous_status,status,actor,reason,version,created_at)
 VALUES (NEW.id || ':' || NEW.version,NEW.id,OLD.status,NEW.status,NEW.updated_by,NEW.change_reason,NEW.version,NEW.updated_at);
END;
