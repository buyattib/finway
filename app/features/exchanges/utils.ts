import type { TCurrency } from '~/lib/types'
import { formatNumber } from '~/lib/utils'

export function calculateRate({
	fromAmount: _fromAmount,
	toAmount: _toAmount,
	fromCurrency,
	toCurrency,
	locale,
}: {
	fromAmount: string
	toAmount: string
	fromCurrency: TCurrency
	toCurrency: TCurrency
	locale: string
}) {
	const fromAmount = Number(_fromAmount)
	const toAmount = Number(_toAmount)

	let rate = toAmount / fromAmount
	let currencyStr = `${toCurrency}/${fromCurrency}`
	if (fromAmount > toAmount) {
		rate = fromAmount / toAmount
		currencyStr = `${fromCurrency}/${toCurrency}`
	}

	return `${formatNumber(rate, locale, { maximumFractionDigits: 3 })} ${currencyStr}`
}
