CREATE TABLE `users` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique_idx` ON `users` (`email`);