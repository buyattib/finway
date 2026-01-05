CREATE TABLE `transfers` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`fromAccountId` text NOT NULL,
	`toAccountId` text NOT NULL,
	`currencyId` text NOT NULL,
	FOREIGN KEY (`fromAccountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toAccountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `transfers_fromAccountId_currencyId_idx` ON `transfers` (`fromAccountId`,`currencyId`);--> statement-breakpoint
CREATE INDEX `transfers_toAccountId_currencyId_idx` ON `transfers` (`toAccountId`,`currencyId`);