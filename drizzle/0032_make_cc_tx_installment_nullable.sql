PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_credit_card_transaction_installments` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`installmentNumber` integer NOT NULL,
	`amount` integer NOT NULL,
	`statementId` text NOT NULL,
	`creditCardTransactionId` text,
	`transactionId` text NOT NULL,
	FOREIGN KEY (`creditCardTransactionId`) REFERENCES `credit_card_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`statementId`) REFERENCES `credit_card_statements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_credit_card_transaction_installments`("createdAt", "updatedAt", "id", "installmentNumber", "amount", "statementId", "creditCardTransactionId", "transactionId") SELECT "createdAt", "updatedAt", "id", "installmentNumber", "amount", "statementId", "creditCardTransactionId", "transactionId" FROM `credit_card_transaction_installments`;--> statement-breakpoint
DROP TABLE `credit_card_transaction_installments`;--> statement-breakpoint
ALTER TABLE `__new_credit_card_transaction_installments` RENAME TO `credit_card_transaction_installments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `credit_card_transaction_installments_creditCardTransactionId_idx` ON `credit_card_transaction_installments` (`creditCardTransactionId`);--> statement-breakpoint
CREATE INDEX `credit_card_transaction_installments_statementId_idx` ON `credit_card_transaction_installments` (`statementId`);--> statement-breakpoint
CREATE INDEX `credit_card_transaction_installments_transactionId_idx` ON `credit_card_transaction_installments` (`transactionId`);