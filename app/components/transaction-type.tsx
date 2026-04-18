import { useTranslation } from 'react-i18next'
import { cva, type VariantProps } from 'class-variance-authority'
import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	type LucideProps,
} from 'lucide-react'

import { cn } from '~/lib/utils'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'
import type { TTransactionType } from '~/routes/transactions/lib/types'

const iconVariants = cva('', {
	variants: {
		size: {
			xs: 'w-5 h-5',
			sm: 'w-6 h-6',
			md: 'w-6 h-6',
			lg: 'w-8 h-8',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

type BaseProps = Pick<LucideProps, 'className'> &
	(
		| {
				variant: 'text'
				size?: undefined
		  }
		| ({
				variant: 'icon' | 'icon-text'
		  } & VariantProps<typeof iconVariants>)
	)

type TransactionTypeProps = BaseProps & {
	transactionType: TTransactionType
} & {
	type: 'transaction' | 'credit_card'
}

export function TransactionType({
	transactionType,
	size,
	className,
	variant,
	type,
}: TransactionTypeProps) {
	const { t } = useTranslation('constants')

	const {
		icon: Icon,
		label,
		textCn,
	} = {
		transaction: {
			[TRANSACTION_TYPE_EXPENSE]: {
				icon: BanknoteArrowUpIcon,
				label: t(`transactionType.${TRANSACTION_TYPE_EXPENSE}`),
				textCn: 'text-danger',
			},
			[TRANSACTION_TYPE_INCOME]: {
				icon: BanknoteArrowDownIcon,
				label: t(`transactionType.${TRANSACTION_TYPE_INCOME}`),
				textCn: 'text-success',
			},
		},
		credit_card: {
			[TRANSACTION_TYPE_EXPENSE]: {
				icon: BanknoteArrowUpIcon,
				label: t(`ccTransactionType.${TRANSACTION_TYPE_EXPENSE}`),
				textCn: 'text-danger',
			},
			[TRANSACTION_TYPE_INCOME]: {
				icon: BanknoteArrowDownIcon,
				label: t(`ccTransactionType.${TRANSACTION_TYPE_INCOME}`),
				textCn: 'text-success',
			},
		},
	}[type][transactionType]

	if (variant === 'text') {
		return <span className={cn(textCn, className)}>{label}</span>
	}

	if (variant === 'icon') {
		return (
			<Icon className={cn(textCn, iconVariants({ size, className }))} />
		)
	}

	return (
		<div
			className={cn(
				'rounded-md w-fit flex items-center gap-1',
				textCn,
				className,
				{
					'text-sm': size === 'sm' || size === 'xs',
					'text-base': size === 'md',
					'text-lg': size === 'lg',
				},
			)}
		>
			<Icon className={cn(iconVariants({ size }))} />
			{label}
		</div>
	)
}
