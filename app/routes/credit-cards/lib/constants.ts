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
	[CC_BRAND_VISA]: 'from-[oklch(0.35_0.05_250)] to-[oklch(0.25_0.04_260)]',
	[CC_BRAND_MASTERCARD]: 'from-[oklch(0.35_0.04_270)] to-[oklch(0.22_0.03_280)]',
	[CC_BRAND_AMEX]: 'from-[oklch(0.38_0.04_230)] to-[oklch(0.25_0.05_240)]',
}

export const CC_BRAND_DEFAULT_GRADIENT = 'from-[oklch(0.32_0.03_270)] to-[oklch(0.22_0.02_270)]'
