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

export const CURRENCY_USD = 'USD'
export const CURRENCY_EUR = 'EUR'
export const CURRENCY_ARS = 'ARS'

export const CURRENCIES = [CURRENCY_USD, CURRENCY_EUR, CURRENCY_ARS] as const

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
}
