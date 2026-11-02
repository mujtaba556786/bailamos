ALTER TABLE `newsletter_subscribers` ADD `confirm_token_hash` text;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `unsubscribe_token` text;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `confirmed_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_newsletter_subscribers_unsubscribe_token` ON `newsletter_subscribers` (`unsubscribe_token`);--> statement-breakpoint
CREATE INDEX `idx_newsletter_subscribers_confirm_token` ON `newsletter_subscribers` (`confirm_token_hash`);
