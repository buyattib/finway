-- Custom SQL migration file, put your code below! --
UPDATE credit_card_transactions
SET type = 'EXPENSE'
WHERE type = 'CHARGE';
--> statement-breakpoint
UPDATE credit_card_transactions
SET type = 'INCOME'
WHERE type = 'REFUND';
