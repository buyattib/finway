import { CreditCardIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { TCurrency } from '~/lib/types'
import { formatDate } from '~/lib/utils'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

type Props = {
	brand: string
	last4: string
	expiryMonth: string
	expiryYear: string
	closingDate: string
	dueDate: string
	accountName: string
	currency: TCurrency
}

export function CreditCardHeader({
	brand,
	last4,
	expiryMonth,
	expiryYear,
	closingDate,
	dueDate,
	accountName,
	currency,
}: Props) {
	const { t } = useTranslation(['credit-cards', 'constants'])

	return (
		<div className='flex flex-col sm:gap-2 gap-4'>
			<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
				<CreditCardIcon className='size-8 text-muted-foreground' />
				<Title level='h1'>
					{brand} •••• {last4}
				</Title>
			</div>
			<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
				<Text size='md' theme='primary'>
					{t('header.expires', {
						month: expiryMonth,
						year: expiryYear,
					})}
				</Text>
				<Text size='sm' theme='muted' className='hidden sm:block'>
					·
				</Text>
				<Text size='md' theme='muted'>
					{accountName}
				</Text>
				<Text size='sm' theme='muted' className='hidden sm:block'>
					·
				</Text>
				<Text
					size='md'
					theme='muted'
					className='flex items-center gap-1'
				>
					<CurrencyIcon currency={currency} size='sm' />
					{t(`constants:currency.${currency}`)}
				</Text>
			</div>
			<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
				<Text size='sm' theme='muted'>
					{t('header.closingDate', {
						date: formatDate(new Date(closingDate)),
					})}
				</Text>
				<Text size='sm' theme='muted' className='hidden sm:block'>
					·
				</Text>
				<Text size='sm' theme='muted'>
					{t('header.dueDate', {
						date: formatDate(new Date(dueDate)),
					})}
				</Text>
			</div>
		</div>
	)
}
