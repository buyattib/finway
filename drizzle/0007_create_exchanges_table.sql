CREATE TABLE `exchanges` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`fromAmount` integer NOT NULL,
	`toAmount` integer NOT NULL,
	`accountId` text NOT NULL,
	`fromCurrencyId` text NOT NULL,
	`toCurrencyId` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fromCurrencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toCurrencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exchanges_accountId_fromCurrencyId_idx` ON `exchanges` (`accountId`,`fromCurrencyId`);--> statement-breakpoint
CREATE INDEX `exchanges_accountId_toCurrencyId_idx` ON `exchanges` (`accountId`,`toCurrencyId`);