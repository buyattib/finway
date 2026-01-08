import type { TCurrency } from '~/routes/accounts/lib/types'

export type CurrencyResponse = {
	currencyId: string
	currency: TCurrency
	amount: string
}

export type CategoryResponse = {
	transactionCategoryId: string
	transactionCategory: string
}

export type MonthResponse = {
	month: number
	year: number
}
