CREATE TABLE `credit_card_statement_payments` (
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`id` text(24) PRIMARY KEY NOT NULL,
	`statementId` text NOT NULL,
	`transferId` text NOT NULL,
	FOREIGN KEY (`statementId`) REFERENCES `credit_card_statements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transferId`) REFERENCES `transfers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_card_statement_payments_statementId_idx` ON `credit_card_statement_payments` (`statementId`);--> statement-breakpoint
CREATE INDEX `credit_card_statement_payments_transferId_idx` ON `credit_card_statement_payments` (`transferId`);