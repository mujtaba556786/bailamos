CREATE TABLE `social_connections` (
	`provider` text PRIMARY KEY NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text,
	`expires_at` integer NOT NULL,
	`scope` text NOT NULL DEFAULT '',
	`account_label` text NOT NULL DEFAULT '',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

CREATE TABLE `social_oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL
);

CREATE INDEX `idx_social_oauth_states_expiry` ON `social_oauth_states` (`expires_at`);
