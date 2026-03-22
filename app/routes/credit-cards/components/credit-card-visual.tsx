import { CreditCardIcon } from 'lucide-react'

import { formatDate, getNextDateForDay } from '~/lib/utils'

import { CC_BRAND_GRADIENTS, CC_BRAND_DEFAULT_GRADIENT } from '../lib/constants'

type Props = {
	brand: string
	last4: string
	expiryMonth: string
	expiryYear: string
	closingDay: number
	dueDay: number
	accountName: string
}

export function CreditCardVisual({
	brand,
	last4,
	expiryMonth,
	expiryYear,
	closingDay,
	dueDay,
	accountName,
}: Props) {
	const gradient = CC_BRAND_GRADIENTS[brand] ?? CC_BRAND_DEFAULT_GRADIENT

	return (
		<div
			className={`bg-linear-to-br ${gradient} rounded-xl p-6 shadow-lg aspect-[1.586/1] w-full max-w-xs flex flex-col justify-between text-white shrink-0`}
		>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<CreditCardIcon className='size-6 text-white/70' />
					<span className='text-lg font-bold tracking-wide'>
						{brand}
					</span>
				</div>
				<p className='text-xs text-white/70'>{accountName}</p>
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
						Valid thru
					</p>
					<p className='text-sm font-medium'>
						{String(expiryMonth).padStart(2, '0')}/{expiryYear}
					</p>
				</div>
				<div className='flex flex-col items-end gap-1'>
					<p className='text-xs text-white/70'>
						Closes {formatDate(getNextDateForDay(closingDay))}
					</p>
					<p className='text-xs text-white/70'>
						Due {formatDate(getNextDateForDay(dueDay))}
					</p>
				</div>
			</div>
		</div>
	)
}
