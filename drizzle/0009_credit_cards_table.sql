CREATE TABLE `credit_cards` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`last4` text NOT NULL,
	`expiryMonth` text NOT NULL,
	`expiryYear` text NOT NULL,
	`accountId` text NOT NULL,
	`currencyId` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_cards_accountId_currencyId_idx` ON `credit_cards` (`accountId`,`currencyId`);
