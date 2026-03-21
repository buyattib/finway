export const CC_BRAND_VISA = 'VISA'
export const CC_BRAND_MASTERCARD = 'MASTERCARD'
export const CC_BRAND_AMEX = 'AMEX'

export const CC_BRANDS = [
	CC_BRAND_VISA,
	CC_BRAND_MASTERCARD,
	CC_BRAND_AMEX,
] as const

export type TCCBrand = (typeof CC_BRANDS)[number]

export const CC_BRAND_GRADIENTS: Record<string, string> = {
	[CC_BRAND_VISA]: 'from-blue to-info',
	[CC_BRAND_MASTERCARD]: 'from-orange to-danger',
	[CC_BRAND_AMEX]: 'from-success to-green',
}

export const CC_BRAND_DEFAULT_GRADIENT = 'from-purple to-cc'
