import { BanknoteArrowDownIcon, BanknoteArrowUpIcon } from 'lucide-react'

export const TRANSACTION_TYPE_EXPENSE = 'EXPENSE'
export const TRANSACTION_TYPE_INCOME = 'INCOME'

export const TRANSACTION_TYPES = [
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
] as const

export const TRANSACTION_TYPE_DISPLAY = {
	[TRANSACTION_TYPE_EXPENSE]: {
		icon: BanknoteArrowUpIcon,
		label: 'Expense',
		color: 'red',
	},
	[TRANSACTION_TYPE_INCOME]: {
		icon: BanknoteArrowDownIcon,
		label: 'Income',
		color: 'green',
	},
}

export const ACTION_CREATION = 'CREATION'
export const ACTION_EDITION = 'EDITION'
