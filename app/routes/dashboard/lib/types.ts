import type { TCurrency } from '~/lib/types'

export type CurrencyResponse = {
	currencyId: string
	currency: TCurrency
	amount: string
}
