-- Custom SQL migration file, put your code below! --
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text DEFAULT '',
	`category` text NOT NULL,
	`type` text NOT NULL,
	`currencyId` text NOT NULL,
	`accountId` text NOT NULL,
	`statementId` text,
	`creditCardTransactionId` text,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creditCardTransactionId`) REFERENCES `credit_card_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`statementId`) REFERENCES `credit_card_statements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("createdAt", "updatedAt", "id", "date", "amount", "description", "category", "type", "currencyId", "accountId", "statementId", "creditCardTransactionId") SELECT "createdAt", "updatedAt", "id", "date", "amount", "description", "category", "type", "currencyId", "accountId", "statementId", "creditCardTransactionId" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `transactions_accountId_currencyId_idx` ON `transactions` (`accountId`,`currencyId`);--> statement-breakpoint
CREATE INDEX `transaction_creditCardTransactionId_idx` ON `transactions` (`creditCardTransactionId`);--> statement-breakpoint
CREATE INDEX `transaction_statementId_idx` ON `transactions` (`statementId`);
