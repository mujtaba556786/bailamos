CREATE TABLE `newsletter_signup_attempts` (
	`key` text NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL DEFAULT 0,
	PRIMARY KEY(`key`, `window`)
);
