CREATE TABLE IF NOT EXISTS `admin_rate_limits` (
	`key` text NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL DEFAULT 0,
	PRIMARY KEY(`key`, `window`)
);
