PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_credit_cards` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`last4` text NOT NULL,
	`expiryMonth` text NOT NULL,
	`expiryYear` text NOT NULL,
	`institution` text NOT NULL,
	`accountId` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_credit_cards`("createdAt", "updatedAt", "id", "brand", "last4", "expiryMonth", "expiryYear", "institution", "accountId") SELECT "createdAt", "updatedAt", "id", "brand", "last4", "expiryMonth", "expiryYear", "institution", "accountId" FROM `credit_cards`;--> statement-breakpoint
DROP TABLE `credit_cards`;--> statement-breakpoint
ALTER TABLE `__new_credit_cards` RENAME TO `credit_cards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `credit_cards_accountId_idx` ON `credit_cards` (`accountId`);