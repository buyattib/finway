export const STAGE_DEVELOPMENT = 'development'
export const STAGE_PRODUCTION = 'production'

// Pagination

export const PAGE_SIZE = 10

// Actions

export const ACTION_CREATION = 'CREATION'
export const ACTION_EDITION = 'EDITION'

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

// Transactions

export const TRANSACTION_TYPE_EXPENSE = 'EXPENSE'
export const TRANSACTION_TYPE_INCOME = 'INCOME'

export const TRANSACTION_TYPES = [
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
] as const

// Credit Cards

export const CC_TRANSACTION_TYPE_CHARGE = 'CHARGE'
export const CC_TRANSACTION_TYPE_REFUND = 'REFUND'

export const CC_TRANSACTION_TYPES = [
	CC_TRANSACTION_TYPE_CHARGE,
	CC_TRANSACTION_TYPE_REFUND,
] as const

export const CC_BRAND_VISA = 'VISA'
export const CC_BRAND_MASTERCARD = 'MASTERCARD'
export const CC_BRAND_AMEX = 'AMEX'

export const CC_BRANDS = [
	CC_BRAND_VISA,
	CC_BRAND_MASTERCARD,
	CC_BRAND_AMEX,
] as const
