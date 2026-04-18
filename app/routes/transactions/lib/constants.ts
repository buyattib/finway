export const TRANSACTION_TYPE_EXPENSE = 'EXPENSE'
export const TRANSACTION_TYPE_INCOME = 'INCOME'

export const TRANSACTION_TYPES = [
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
] as const

const _COMMON_TRANSACTION_CATEGORIES = [
	'savings_and_investments',
	'other',
] as const
const _ONLY_INCOME_TRANSACTION_CATEGORIES = ['salary'] as const
const _ONLY_EXPENSE_TRANSACTION_CATEGORIES = [
	'housing',
	'household_services',
	'utilities',
	'groceries',
	'food_dining',
	'transportation',
	'health',
	'shopping',
	'entertainment',
	'subscriptions',
	'personal_care',
	'pets',
	'travel',
	'taxes',
	'debt_payments',
] as const

export const TRANSACTION_CATEGORIES = {
	[TRANSACTION_TYPE_EXPENSE]: [
		..._COMMON_TRANSACTION_CATEGORIES,
		..._ONLY_EXPENSE_TRANSACTION_CATEGORIES,
	],
	[TRANSACTION_TYPE_INCOME]: [
		..._COMMON_TRANSACTION_CATEGORIES,
		..._ONLY_INCOME_TRANSACTION_CATEGORIES,
	],
} as const

export const ALL_TRANSACTION_CATEGORIES = [
	..._COMMON_TRANSACTION_CATEGORIES,
	..._ONLY_EXPENSE_TRANSACTION_CATEGORIES,
	..._ONLY_INCOME_TRANSACTION_CATEGORIES,
] as const
