CREATE TABLE `gift_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`organization` varchar(255),
	`status` enum('in_progress','awaiting_external','completed') NOT NULL DEFAULT 'in_progress',
	`self_answers` json,
	`external_token_1` varchar(64),
	`external_token_2` varchar(64),
	`external_answers_1` json,
	`external_answers_2` json,
	`manifest_gifts` json,
	`latent_gifts` json,
	`result_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gift_tests_id` PRIMARY KEY(`id`)
);
