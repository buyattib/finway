-- Backfill ownerId and institution for credit cards that existed before 0021.
-- After 0021, pre-existing rows have ownerId = '' and institution = '', but
-- still carry the legacy accountId that used to link them to an account.
UPDATE credit_cards
SET ownerId = (
	SELECT accounts.ownerId FROM accounts WHERE accounts.id = credit_cards.accountId
)
WHERE ownerId = '' AND accountId IS NOT NULL;
--> statement-breakpoint
UPDATE credit_cards
SET institution = (
	SELECT accounts.name FROM accounts WHERE accounts.id = credit_cards.accountId
)
WHERE institution = '' AND accountId IS NOT NULL;
