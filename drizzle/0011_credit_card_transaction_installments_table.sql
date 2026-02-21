CREATE TABLE `credit_card_transaction_installments` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`installmentNumber` integer NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`creditCardTransactionId` text NOT NULL,
	FOREIGN KEY (`creditCardTransactionId`) REFERENCES `credit_card_transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_card_transaction_installments_creditCardTransactionId_idx` ON `credit_card_transaction_installments` (`creditCardTransactionId`);