import { cn } from '~/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

import USDIcon from '~/assets/currencies/usd.svg'
import EURIcon from '~/assets/currencies/eur.svg'
import ARSIcon from '~/assets/currencies/ars.svg'
import USDTIcon from '~/assets/currencies/usdt.svg'
import USDCIcon from '~/assets/currencies/usdc.svg'
import DAIIcon from '~/assets/currencies/dai.svg'

import {
	CURRENCY_USD,
	CURRENCY_ARS,
	CURRENCY_EUR,
	CURRENCY_USDT,
	CURRENCY_USDC,
	CURRENCY_DAI,
	CURRENCY_DISPLAY,
} from '~/lib/constants'
import type { TCurrency } from '~/lib/types'

const CURRENCY_ICONS = {
	[CURRENCY_USD]: USDIcon,
	[CURRENCY_EUR]: EURIcon,
	[CURRENCY_ARS]: ARSIcon,
	[CURRENCY_USDT]: USDTIcon,
	[CURRENCY_USDC]: USDCIcon,
	[CURRENCY_DAI]: DAIIcon,
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
