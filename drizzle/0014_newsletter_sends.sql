CREATE TABLE `newsletter_sends` (
	`campaign_id` text NOT NULL,
	`email` text NOT NULL,
	`sent_at` text NOT NULL,
	PRIMARY KEY(`campaign_id`, `email`)
);
