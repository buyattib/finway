import type { Route } from './+types/dashboard'
import { WalletIcon } from 'lucide-react'

import { dbContext, userContext } from '~/lib/context'
import { formatNumber } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

import { getBalances } from '~/routes/accounts/lib/queries'
import { CURRENCY_DISPLAY } from '~/routes/accounts/lib/constants'

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const balances = await getBalances({
		db,
		ownerId: user.id,
		group: 'currency',
	})

	// TODO: get this month expenses by currency
	// TODO: get this month incomes by currency

	return { balances }
}

export default function Dashboard({
	loaderData: { balances },
}: Route.ComponentProps) {
	const cards = [
		{
			title: 'Total balances',
			icon: <WalletIcon />,
			data: balances,
		},
	]

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
				{cards.map(({ title, icon, data }) => (
					<Card key={title}>
						<CardHeader className='flex items-center justify-between'>
							<CardTitle>{title}</CardTitle>
							{icon}
						</CardHeader>
						<CardContent>
							{data.length === 0 && (
								<Text size='md' weight='semi'>
									No balances yet
								</Text>
							)}
							<ul className='flex flex-col gap-2'>
								{data.map(
									({ currencyId, currency, balance }) => (
										<li
											key={currencyId}
											className='flex items-center justify-between gap-2'
										>
											<Text className='flex items-center gap-2'>
												<CurrencyIcon
													currency={currency}
													size='sm'
												/>
												{currency}
											</Text>
											<Text>
												{
													CURRENCY_DISPLAY[currency]
														.symbol
												}{' '}
												{formatNumber(balance)}
											</Text>
										</li>
									),
								)}
							</ul>
						</CardContent>
					</Card>
				))}
			</div>
		</>
	)
}
