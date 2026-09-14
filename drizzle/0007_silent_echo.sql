CREATE TABLE `operations_config` (
	`id` text PRIMARY KEY NOT NULL,
	`config_json` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
