CREATE TABLE `transactions` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text DEFAULT '',
	`type` text NOT NULL,
	`accountId` text NOT NULL,
	`currencyId` text NOT NULL,
	`transactionCategoryId` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transactionCategoryId`) REFERENCES `transaction_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `transactions_accountId_currencyId_idx` ON `transactions` (`accountId`,`currencyId`);