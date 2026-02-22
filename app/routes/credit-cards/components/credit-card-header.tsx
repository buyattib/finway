import { CreditCardIcon } from 'lucide-react'

import type { TCurrency } from '~/lib/types'
import { CURRENCY_DISPLAY } from '~/lib/constants'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

type Props = {
	brand: string
	last4: string
	expiryMonth: string
	expiryYear: string
	accountName: string
	currency: TCurrency
}

export function CreditCardHeader({
	brand,
	last4,
	expiryMonth,
	expiryYear,
	accountName,
	currency,
}: Props) {
	const { label } = CURRENCY_DISPLAY[currency]

	return (
		<div className='flex flex-col sm:gap-2 gap-4'>
			<div className='flex items-center gap-4'>
				<CreditCardIcon className='size-8 text-muted-foreground' />
				<Title level='h1'>
					{brand} •••• {last4}
				</Title>
			</div>
			<div className='flex flex-col sm:flex-row sm:items-center sm:gap-4'>
				<Text size='md' theme='primary'>
					Expires {expiryMonth}/{expiryYear}
				</Text>
				<Text size='sm' theme='muted'>
					·
				</Text>
				<Text size='md' theme='muted'>
					{accountName}
				</Text>
				<Text size='sm' theme='muted'>
					·
				</Text>
				<Text
					size='md'
					theme='muted'
					className='flex items-center gap-1'
				>
					<CurrencyIcon currency={currency} size='sm' />
					{label}
				</Text>
			</div>
		</div>
	)
}
