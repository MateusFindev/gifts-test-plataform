CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`invite_code` varchar(64),
	`domain` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_idx` UNIQUE(`slug`),
	CONSTRAINT `organizations_invite_code_idx` UNIQUE(`invite_code`)
);
--> statement-breakpoint
CREATE TABLE `user_organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`membership_role` enum('SUPER_ADMIN','ORG_ADMIN','END_USER') NOT NULL DEFAULT 'END_USER',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_org_unique_idx` UNIQUE(`user_id`,`organization_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','SUPER_ADMIN','ORG_ADMIN','END_USER') NOT NULL DEFAULT 'user';--> statement-breakpoint
UPDATE `users` SET `role` = 'SUPER_ADMIN' WHERE `role` = 'admin';--> statement-breakpoint
UPDATE `users` SET `role` = 'END_USER' WHERE `role` = 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('SUPER_ADMIN','ORG_ADMIN','END_USER') NOT NULL DEFAULT 'END_USER';--> statement-breakpoint
ALTER TABLE `gift_tests` ADD `organization_id` int;--> statement-breakpoint
ALTER TABLE `user_organizations` ADD CONSTRAINT `user_organizations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_organizations` ADD CONSTRAINT `user_organizations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gift_tests` ADD CONSTRAINT `gift_tests_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;