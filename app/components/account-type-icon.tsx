import { cva, type VariantProps } from 'class-variance-authority'
import {
	BanknoteIcon,
	BitcoinIcon,
	ChartCandlestick,
	LandmarkIcon,
	WalletIcon,
	type LucideProps,
} from 'lucide-react'

import { cn } from '~/lib/utils'

import {
	ACCOUNT_TYPE_BANK,
	ACCOUNT_TYPE_CASH,
	ACCOUNT_TYPE_DIGITAL_WALLET,
	ACCOUNT_TYPE_CRYPTO_WALLET,
	ACCOUNT_TYPE_BROKER,
} from '~/routes/accounts/lib/constants'
import type { TAccountType } from '~/routes/accounts/lib/types'

const accountTypeIconVariants = cva('text-background', {
	variants: {
		size: {
			sm: 'w-6 h-6',
			md: 'w-6 h-6',
			lg: 'w-8 h-8',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

const containerVariants = cva('rounded-full', {
	variants: {
		size: {
			sm: 'p-1',
			md: 'p-2',
			lg: 'p-2',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

export type AccountTypeIconProps = Pick<LucideProps, 'className'> &
	VariantProps<typeof accountTypeIconVariants> & {
		accountType: TAccountType
	}

const ACCOUNT_TYPE_VALUES = {
	[ACCOUNT_TYPE_BANK]: {
		icon: LandmarkIcon,
		color: 'bg-blue',
	},
	[ACCOUNT_TYPE_CASH]: {
		icon: BanknoteIcon,
		color: 'bg-green',
	},
	[ACCOUNT_TYPE_DIGITAL_WALLET]: {
		icon: WalletIcon,
		color: 'bg-purple',
	},
	[ACCOUNT_TYPE_CRYPTO_WALLET]: {
		icon: BitcoinIcon,
		color: 'bg-orange',
	},
	[ACCOUNT_TYPE_BROKER]: {
		icon: ChartCandlestick,
		color: 'bg-lemon-yellow',
	},
}

export function AccountTypeIcon({
	accountType,
	size,
	className,
}: AccountTypeIconProps) {
	const { icon: Icon, color: bg } = ACCOUNT_TYPE_VALUES[accountType]

	return (
		<div className={cn(containerVariants({ size }), bg)}>
			<Icon
				className={cn(accountTypeIconVariants({ size, className }))}
			/>
		</div>
	)
}
