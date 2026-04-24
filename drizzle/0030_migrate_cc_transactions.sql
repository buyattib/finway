-- Migrate credit_card_transactions into transactions.
-- For every cc_transaction we create a transaction row on the CC's
-- underlying account, then point every related installment at the new
-- transaction via the nullable transactionId FK added in 0029.

-- Temp mapping so the id generated for the new transaction is reachable
-- from both the INSERT and the installment UPDATE.
CREATE TEMPORARY TABLE _cc_tx_map (
	ccTransactionId TEXT PRIMARY KEY,
	transactionId TEXT NOT NULL
);--> statement-breakpoint

INSERT INTO _cc_tx_map (ccTransactionId, transactionId)
SELECT id, lower(hex(randomblob(12)))
FROM credit_card_transactions;--> statement-breakpoint

INSERT INTO transactions (
	id, date, amount, category, type, description,
	accountId, currencyId, createdAt, updatedAt
)
SELECT
	m.transactionId,
	cct.date,
	cct.amount,
	cct.category,
	cct.type,
	cct.description,
	cc.accountId,
	cct.currencyId,
	cct.createdAt,
	cct.updatedAt
FROM credit_card_transactions cct
JOIN _cc_tx_map m ON m.ccTransactionId = cct.id
JOIN credit_cards cc ON cc.id = cct.creditCardId;--> statement-breakpoint

UPDATE credit_card_transaction_installments
SET transactionId = (
	SELECT transactionId
	FROM _cc_tx_map
	WHERE ccTransactionId = credit_card_transaction_installments.creditCardTransactionId
)
WHERE transactionId IS NULL;--> statement-breakpoint

DROP TABLE _cc_tx_map;
