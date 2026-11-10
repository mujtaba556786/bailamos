CREATE TABLE IF NOT EXISTS `admin_auth_failures` (
	`key` text NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL DEFAULT 0,
	PRIMARY KEY(`key`, `window`)
);
