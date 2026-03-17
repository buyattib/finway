import { CreditCardIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { formatDate, getNextDateForDay } from '~/lib/utils'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'

type Props = {
	brand: string
	last4: string
	expiryMonth: string
	expiryYear: string
	closingDay: number
	dueDay: number
	accountName: string
}

export function CreditCardHeader({
	brand,
	last4,
	expiryMonth,
	expiryYear,
	closingDay,
	dueDay,
	accountName,
}: Props) {
	const { t } = useTranslation('credit-cards')

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
			</div>
			<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
				<Text size='sm' theme='muted'>
					{t('header.closingDay', {
						date: formatDate(getNextDateForDay(closingDay)),
					})}
				</Text>
				<Text size='sm' theme='muted' className='hidden sm:block'>
					·
				</Text>
				<Text size='sm' theme='muted'>
					{t('header.dueDay', {
						date: formatDate(getNextDateForDay(dueDay)),
					})}
				</Text>
			</div>
		</div>
	)
}
