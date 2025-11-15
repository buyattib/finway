import { cn } from '~/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

import USAFlagIcon from '~/assets/flags/usa-flag.svg'
import EURFlagIcon from '~/assets/flags/europe-flag.svg'
import ARSFlagIcon from '~/assets/flags/argentina-flag.svg'

import {
	CURRENCY_USD,
	CURRENCY_ARS,
	CURRENCY_EUR,
	CURRENCY_DISPLAY,
} from '~/routes/accounts/lib/constants'
import type { TCurrency } from '~/routes/accounts/lib/types'

const CURRENCY_ICONS = {
	[CURRENCY_USD]: USAFlagIcon,
	[CURRENCY_EUR]: EURFlagIcon,
	[CURRENCY_ARS]: ARSFlagIcon,
}

const currencyIconVariants = cva('text-background', {
	variants: {
		size: {
			sm: 'w-5 h-5',
			md: 'w-6 h-6',
			lg: 'w-8 h-8',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

type CurrencyIconProps = React.ComponentProps<'img'> &
	VariantProps<typeof currencyIconVariants> & {
		currency: TCurrency
	}

export function CurrencyIcon({
	currency,
	size,
	className,
	...props
}: CurrencyIconProps) {
	const src = CURRENCY_ICONS[currency]
	return (
		<img
			{...props}
			src={src}
			alt={CURRENCY_DISPLAY[currency].label}
			className={cn(currencyIconVariants({ size, className }))}
		/>
	)
}
