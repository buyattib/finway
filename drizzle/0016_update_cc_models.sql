CREATE TABLE `credit_card_statements` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`closingDate` text NOT NULL,
	`dueDate` text NOT NULL,
	`creditCardId` text NOT NULL,
	FOREIGN KEY (`creditCardId`) REFERENCES `credit_cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_card_statements_creditCardId_idx` ON `credit_card_statements` (`creditCardId`);--> statement-breakpoint
ALTER TABLE `credit_card_transaction_installments` ADD `statementId` text NOT NULL REFERENCES credit_card_statements(id);--> statement-breakpoint
CREATE INDEX `credit_card_transaction_installments_statementId_idx` ON `credit_card_transaction_installments` (`statementId`);--> statement-breakpoint
ALTER TABLE `credit_card_transaction_installments` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `credit_cards` DROP COLUMN `closingDay`;--> statement-breakpoint
ALTER TABLE `credit_cards` DROP COLUMN `dueDay`;