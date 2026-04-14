-- Custom SQL migration file, put your code below! --
UPDATE accounts
SET accountType = CASE
  WHEN accountType = 'crypto-wallet' THEN 'crypto_wallet'
  WHEN accountType = 'digital-wallet' THEN 'digital_wallet'
  ELSE accountType
END;
