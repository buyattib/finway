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
	CC_TRANSACTION_TYPE_CHARGE,
	CC_TRANSACTION_TYPE_REFUND,
} from '~/lib/constants'
import type { TCCTransactionType, TTransactionType } from '~/lib/types'

const iconVariants = cva('', {
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
	transactionType: TTransactionType | TCCTransactionType
}

export function TransactionType({
	transactionType,
	size,
	className,
	variant,
}: TransactionTypeProps) {
	const { t } = useTranslation('components')

	const {
		icon: Icon,
		label,
		textCn,
	} = {
		[TRANSACTION_TYPE_EXPENSE]: {
			icon: BanknoteArrowUpIcon,
			label: t(`transactionType.${TRANSACTION_TYPE_EXPENSE}`),
			textCn: 'text-red',
		},
		[TRANSACTION_TYPE_INCOME]: {
			icon: BanknoteArrowDownIcon,
			label: t(`transactionType.${TRANSACTION_TYPE_INCOME}`),
			textCn: 'text-green',
		},
		[CC_TRANSACTION_TYPE_CHARGE]: {
			icon: BanknoteArrowUpIcon,
			label: t(`ccTransactionType.${CC_TRANSACTION_TYPE_CHARGE}`),
			textCn: 'text-red',
		},
		[CC_TRANSACTION_TYPE_REFUND]: {
			icon: BanknoteArrowDownIcon,
			label: t(`ccTransactionType.${CC_TRANSACTION_TYPE_REFUND}`),
			textCn: 'text-green',
		},
	}[transactionType]

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
			)}
		>
			<Icon className={cn(iconVariants({ size }))} />
			{label}
		</div>
	)
}
