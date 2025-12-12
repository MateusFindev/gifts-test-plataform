ALTER TABLE `gift_tests` ADD `manifest_gift_scores` json;--> statement-breakpoint
ALTER TABLE `gift_tests` ADD `latent_gift_scores` json;--> statement-breakpoint
ALTER TABLE `organizations` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `organizations` ADD `contact_name` varchar(255);