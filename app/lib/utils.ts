import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { TCurrency } from '~/lib/types'
import {
	CURRENCY_USD,
	CURRENCY_EUR,
	CURRENCY_ARS,
	CURRENCY_USDT,
	CURRENCY_USDC,
	CURRENCY_DAI,
} from '~/lib/constants'

export function getCurrencySymbol(currency: TCurrency) {
	const symbols = {
		[CURRENCY_USD]: '$',
		[CURRENCY_EUR]: '€',
		[CURRENCY_ARS]: '$',
		[CURRENCY_USDT]: '$',
		[CURRENCY_USDC]: '$',
		[CURRENCY_DAI]: '$',
	}
	return symbols[currency]
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function removeCommas(value: string) {
	return value.replace(/,/g, '')
}

export function isValueNumeric(value: string) {
	const NUMERIC_PATTERN = /^$|^\d+\.?\d*$/
	return NUMERIC_PATTERN.test(value)
}

export function formatNumber(
	num: number | string,
	locale: string,
	config: Intl.NumberFormatOptions = {},
) {
	const formatter = new Intl.NumberFormat(locale, {
		style: 'decimal',
		minimumFractionDigits: 2,
		...config,
	})
	return formatter.format(Number(num))
}

export function initializeDate() {
	const now = new Date()
	return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export function addMonth(dateStr: string): string {
	const date = new Date(dateStr)
	const targetDay = date.getUTCDate()
	date.setUTCMonth(date.getUTCMonth() + 1)
	// Handle overflow (e.g., Jan 31 -> Feb 28)
	if (date.getUTCDate() !== targetDay) {
		date.setUTCDate(0)
	}
	return date.toISOString()
}

export function subtractMonth(dateStr: string): string {
	const date = new Date(dateStr)
	const targetDay = date.getUTCDate()
	date.setUTCMonth(date.getUTCMonth() - 1)
	if (date.getUTCDate() !== targetDay) {
		date.setUTCDate(0)
	}
	return date.toISOString()
}

export function formatDate(
	date: Date,
	locale: string,
	config: Intl.DateTimeFormatOptions = {},
) {
	return date.toLocaleDateString(locale, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
		...config,
	})
}
