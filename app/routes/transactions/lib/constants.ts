export const TRANSACTION_TYPE_EXPENSE = 'EXPENSE'
export const TRANSACTION_TYPE_INCOME = 'INCOME'

export const TRANSACTION_TYPES = [
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
] as const

export const TRANSACTION_CATEGORIES = [
	'housing',
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
	'other',
	'income',
	'savings_and_investments',
	'debt_payments',
] as const
