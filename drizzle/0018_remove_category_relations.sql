PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_credit_card_transactions` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text DEFAULT '',
	`type` text NOT NULL,
	`creditCardId` text NOT NULL,
	`currencyId` text NOT NULL,
	`category` text NOT NULL,
	FOREIGN KEY (`creditCardId`) REFERENCES `credit_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_credit_card_transactions`("createdAt", "updatedAt", "id", "date", "amount", "description", "type", "creditCardId", "currencyId", "category") SELECT "createdAt", "updatedAt", "id", "date", "amount", "description", "type", "creditCardId", "currencyId", "category" FROM `credit_card_transactions`;--> statement-breakpoint
DROP TABLE `credit_card_transactions`;--> statement-breakpoint
ALTER TABLE `__new_credit_card_transactions` RENAME TO `credit_card_transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `credit_card_transactions_creditCardId_idx` ON `credit_card_transactions` (`creditCardId`);--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text DEFAULT '',
	`type` text NOT NULL,
	`accountId` text NOT NULL,
	`currencyId` text NOT NULL,
	`category` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("createdAt", "updatedAt", "id", "date", "amount", "description", "type", "accountId", "currencyId", "category") SELECT "createdAt", "updatedAt", "id", "date", "amount", "description", "type", "accountId", "currencyId", "category" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE INDEX `transactions_accountId_currencyId_idx` ON `transactions` (`accountId`,`currencyId`);