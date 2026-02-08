import { cva, type VariantProps } from 'class-variance-authority'
import { type LucideProps } from 'lucide-react'

import { cn } from '~/lib/utils'

import {
	TRANSACTION_TYPE_DISPLAY,
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/lib/constants'
import type { TTransactionType } from '~/lib/types'

const transactionTypeIconVariants = cva('', {
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

const containerVariants = cva('rounded-md', {
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

export type TransactionTypeIconProps = Pick<LucideProps, 'className'> &
	VariantProps<typeof transactionTypeIconVariants> & {
		transactionType: TTransactionType
	}

export function TransactionTypeIcon({
	transactionType,
	size,
	className,
}: TransactionTypeIconProps) {
	const { icon: Icon } = TRANSACTION_TYPE_DISPLAY[transactionType]

	const color = {
		'text-green': transactionType === TRANSACTION_TYPE_INCOME,
		'text-red': transactionType === TRANSACTION_TYPE_EXPENSE,
	}

	return (
		<div className={cn(containerVariants({ size }))}>
			<Icon
				className={cn(
					transactionTypeIconVariants({ size, className }),
					color,
				)}
			/>
		</div>
	)
}
