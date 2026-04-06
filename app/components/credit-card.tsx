import { CreditCardIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn, formatDate } from '~/lib/utils'

const BRAND_GRADIENTS: Record<string, string> = {
	VISA: 'from-[oklch(0.35_0.05_250)] to-[oklch(0.25_0.04_260)]',
	MASTERCARD: 'from-[oklch(0.35_0.04_270)] to-[oklch(0.22_0.03_280)]',
	AMEX: 'from-[oklch(0.38_0.04_230)] to-[oklch(0.25_0.05_240)]',
}

const DEFAULT_GRADIENT = 'from-[oklch(0.32_0.03_270)] to-[oklch(0.22_0.02_270)]'

type Props = {
	brand: string
	last4: string
	expiryMonth: string
	expiryYear: string
	closingDate?: string
	dueDate?: string
	accountName: string
	className?: string
}

export function CreditCard({
	brand,
	last4,
	expiryMonth,
	expiryYear,
	closingDate,
	dueDate,
	accountName,
	className,
}: Props) {
	const { t } = useTranslation('components')
	const gradient = BRAND_GRADIENTS[brand] ?? DEFAULT_GRADIENT

	return (
		<div
			className={cn(
				`bg-linear-to-br ${gradient} rounded-xl p-6 shadow-lg aspect-[1.586/1] flex flex-col justify-between text-white max-h-76`,
				className,
			)}
		>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<CreditCardIcon className='size-6 text-white/70' />
					<span className='text-lg font-bold tracking-wide'>
						{brand}
					</span>
				</div>
				<p className='text-sm text-white/70'>{accountName}</p>
			</div>
			<div>
				<p className='text-lg tracking-[0.25em] font-mono'>
					{'•••• •••• •••• '}
					{last4}
				</p>
			</div>
			<div className='flex items-end justify-between'>
				<div>
					<p className='text-[10px] uppercase tracking-wider text-white/60'>
						{t('creditCard.validThru')}
					</p>
					<p className='text-sm font-medium'>
						{String(expiryMonth).padStart(2, '0')}/{expiryYear}
					</p>
				</div>
				{closingDate && dueDate && (
					<div className='flex flex-col items-end gap-1'>
						<p className='text-xs text-white/70'>
							{t('creditCard.closingDay', {
								date: formatDate(new Date(closingDate)),
							})}
						</p>
						<p className='text-xs text-white/70'>
							{t('creditCard.dueDay', {
								date: formatDate(new Date(dueDate)),
							})}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
