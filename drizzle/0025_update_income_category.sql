
-- Custom SQL migration file, put your code below! --
UPDATE credit_card_transactions
SET category = 'income'
WHERE category = 'salary';
--> statement-breakpoint
UPDATE transactions
SET category = 'income'
WHERE category = 'salary';
