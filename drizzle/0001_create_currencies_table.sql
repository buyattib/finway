CREATE TABLE `currencies` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`code` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currencies_code_unique_idx` ON `currencies` (`code`);