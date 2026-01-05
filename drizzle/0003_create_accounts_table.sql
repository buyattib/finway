CREATE TABLE `accounts` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`accountType` text NOT NULL,
	`ownerId` text NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `accounts_ownerId_idx` ON `accounts` (`ownerId`);