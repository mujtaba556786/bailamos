CREATE TABLE `marketing_content` (
	`id` text PRIMARY KEY NOT NULL,
	`content_json` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
