ALTER TABLE `credit_card_transactions` ADD `installmentCount` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `statementId` text REFERENCES credit_card_statements(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `creditCardTransactionId` text REFERENCES credit_card_transactions(id);--> statement-breakpoint
CREATE INDEX `transaction_creditCardTransactionId_idx` ON `transactions` (`creditCardTransactionId`);--> statement-breakpoint
CREATE INDEX `transaction_statementId_idx` ON `transactions` (`statementId`);