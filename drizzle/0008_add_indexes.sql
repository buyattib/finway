CREATE INDEX `accounts_ownerId_idx` ON `accounts` (`ownerId`);--> statement-breakpoint
CREATE INDEX `exchanges_accountId_fromCurrencyId_idx` ON `exchanges` (`accountId`,`fromCurrencyId`);--> statement-breakpoint
CREATE INDEX `exchanges_accountId_toCurrencyId_idx` ON `exchanges` (`accountId`,`toCurrencyId`);--> statement-breakpoint
CREATE INDEX `transactions_accountId_currencyId_idx` ON `transactions` (`accountId`,`currencyId`);--> statement-breakpoint
CREATE INDEX `transfers_fromAccountId_currencyId_idx` ON `transfers` (`fromAccountId`,`currencyId`);--> statement-breakpoint
CREATE INDEX `transfers_toAccountId_currencyId_idx` ON `transfers` (`toAccountId`,`currencyId`);