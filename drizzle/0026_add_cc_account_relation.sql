ALTER TABLE `credit_cards` ADD `accountId` text REFERENCES accounts(id);--> statement-breakpoint
CREATE INDEX `credit_cards_accountId_idx` ON `credit_cards` (`accountId`);
