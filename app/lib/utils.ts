import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
	config: Intl.NumberFormatOptions = {},
) {
	const formatter = new Intl.NumberFormat(undefined, {
		style: 'decimal',
		minimumFractionDigits: 2,
		...config,
	})
	return formatter.format(Number(num))
}

export function formatDate(
	date: Date,
	config: Intl.DateTimeFormatOptions = {},
) {
	return date.toLocaleDateString('en', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		...config,
	})
}
