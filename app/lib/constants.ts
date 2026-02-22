// Actions

export const ACTION_CREATION = 'CREATION'
export const ACTION_EDITION = 'EDITION'

// Accounts

export const ACCOUNT_TYPE_BANK = 'bank'
export const ACCOUNT_TYPE_CASH = 'cash'
export const ACCOUNT_TYPE_DIGITAL_WALLET = 'digital-wallet'
export const ACCOUNT_TYPE_CRYPTO_WALLET = 'crypto-wallet'
export const ACCOUNT_TYPE_BROKER = 'broker'

export const ACCOUNT_TYPES = [
	ACCOUNT_TYPE_BANK,
	ACCOUNT_TYPE_CASH,
	ACCOUNT_TYPE_DIGITAL_WALLET,
	ACCOUNT_TYPE_CRYPTO_WALLET,
	ACCOUNT_TYPE_BROKER,
] as const

export const ACCOUNT_TYPE_LABEL = {
	[ACCOUNT_TYPE_BANK]: 'Bank',
	[ACCOUNT_TYPE_CASH]: 'Cash',
	[ACCOUNT_TYPE_DIGITAL_WALLET]: 'Digital Wallet',
	[ACCOUNT_TYPE_CRYPTO_WALLET]: 'Crypto Wallet',
	[ACCOUNT_TYPE_BROKER]: 'Broker',
}

// Currencies

export const CURRENCY_USD = 'USD'
export const CURRENCY_EUR = 'EUR'
export const CURRENCY_ARS = 'ARS'
export const CURRENCY_USDT = 'USDT'
export const CURRENCY_USDC = 'USDC'
export const CURRENCY_DAI = 'DAI'

export const CURRENCIES = [
	CURRENCY_USD,
	CURRENCY_EUR,
	CURRENCY_ARS,
	CURRENCY_USDT,
	CURRENCY_USDC,
	CURRENCY_DAI,
] as const

export const CURRENCY_DISPLAY = {
	[CURRENCY_USD]: {
		label: 'US Dollar (USD)',
		symbol: '$',
	},
	[CURRENCY_EUR]: {
		label: 'Euro (EUR)',
		symbol: '€',
	},
	[CURRENCY_ARS]: {
		label: 'Argentine Peso (ARS)',
		symbol: '$',
	},
	[CURRENCY_USDT]: {
		label: 'Tether (USDT)',
		symbol: '$',
	},
	[CURRENCY_USDC]: {
		label: 'USD Coin (USDC)',
		symbol: '$',
	},
	[CURRENCY_DAI]: {
		label: 'Dai (DAI)',
		symbol: '$',
	},
}

// Transactions

export const TRANSACTION_TYPE_EXPENSE = 'EXPENSE'
export const TRANSACTION_TYPE_INCOME = 'INCOME'

export const TRANSACTION_TYPES = [
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
] as const

export const TRANSACTION_TYPE_LABEL = {
	[TRANSACTION_TYPE_EXPENSE]: 'Expense',
	[TRANSACTION_TYPE_INCOME]: 'Income',
}

// Credit Cards

export const CC_TRANSACTION_TYPE_CHARGE = 'CHARGE'
export const CC_TRANSACTION_TYPE_REFUND = 'REFUND'

export const CC_TRANSACTION_TYPES = [
	CC_TRANSACTION_TYPE_CHARGE,
	CC_TRANSACTION_TYPE_REFUND,
] as const

export const CC_TRANSACTION_TYPE_LABEL = {
	[CC_TRANSACTION_TYPE_CHARGE]: 'Charge',
	[CC_TRANSACTION_TYPE_REFUND]: 'Refund',
}
