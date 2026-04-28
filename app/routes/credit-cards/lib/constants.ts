const CC_BRAND_VISA = 'VISA'
const CC_BRAND_MASTERCARD = 'MASTERCARD'
const CC_BRAND_AMEX = 'AMEX'

export const CC_BRANDS = [
	CC_BRAND_VISA,
	CC_BRAND_MASTERCARD,
	CC_BRAND_AMEX,
] as const

export const CC_INSTALLMENT_OPTIONS = ['1', '3', '6', '9', '12', '18', '24']

export const STATEMENT_STATUS_PAID = 'paid'
export const STATEMENT_STATUS_PENDING = 'pending'
