CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`guest_count` integer NOT NULL,
	`duration_minutes` integer DEFAULT 120 NOT NULL,
	`table_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text NOT NULL,
	`occasion` text DEFAULT '' NOT NULL,
	`dietary` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
