-- Backfill an underlying account for every existing credit card that
-- doesn't have one. The id is generated in SQL (24-char hex) so we can
-- reference it from both the INSERT and the CC row.

UPDATE credit_cards
SET accountId = lower(hex(randomblob(12)))
WHERE accountId IS NULL;
--> statement-breakpoint
INSERT INTO accounts (id, name, description, accountType, ownerId, createdAt, updatedAt)
SELECT
	credit_cards.accountId,
	'',
	'',
	'credit-card',
	credit_cards.ownerId,
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM credit_cards
WHERE credit_cards.accountId IS NOT NULL
	AND NOT EXISTS (
		SELECT 1 FROM accounts WHERE accounts.id = credit_cards.accountId
	);
