
-- Custom SQL migration file, put your code below! --
UPDATE credit_card_transactions
SET category = 'salary'
WHERE category = 'income';
--> statement-breakpoint
UPDATE transactions
SET category = 'salary'
WHERE category = 'income';
