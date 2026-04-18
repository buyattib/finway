-- Custom SQL migration file, put your code below! --
UPDATE credit_card_transactions
SET category = 'food_dining'
WHERE category = 'dining_out';

UPDATE transactions
SET category = 'food_dining'
WHERE category = 'dining_out';
