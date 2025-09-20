CREATE TABLE `accounts` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`deletedAt` text DEFAULT 'null',
	`id` text(24) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`accountType` text NOT NULL,
	`ownerId` text NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account_currencies` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`deletedAt` text DEFAULT 'null',
	`id` text(24) PRIMARY KEY NOT NULL,
	`balance` integer NOT NULL,
	`currency` text NOT NULL,
	`accountId` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
