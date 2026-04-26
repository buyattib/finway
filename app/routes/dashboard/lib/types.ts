import type { TCurrency } from '~/lib/types'
import type { TCategory } from '~/features/transactions/types'

export type CurrencyResponse = {
	currencyId: string
	currency: TCurrency
	amount: string
}

export type CategoryResponse = {
	category: TCategory
	currencyId: string
	currency: TCurrency
	amount: string
}
