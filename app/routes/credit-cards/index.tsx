import { Link } from 'react-router'
import { CreditCardIcon, PlusIcon } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'
import {
	creditCard as creditCardTable,
	account as accountTable,
	currency as currencyTable,
} from '~/database/schema'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { CurrencyIcon } from '~/components/currency-icon'

import { CURRENCY_DISPLAY } from '~/lib/constants'

export function meta() {
	return [
		{ title: 'Credit Cards | Finway' },
		{
			property: 'og:title',
			content: 'Credit Cards | Finway',
		},
		{
			name: 'description',
			content: 'Your credit cards',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const creditCards = await db
		.select({
			id: creditCardTable.id,
			last4: creditCardTable.last4,
			brand: creditCardTable.brand,
			expiryMonth: creditCardTable.expiryMonth,
			expiryYear: creditCardTable.expiryYear,
			accountName: accountTable.name,
			currencyCode: currencyTable.code,
		})
		.from(creditCardTable)
		.innerJoin(accountTable, eq(creditCardTable.accountId, accountTable.id))
		.innerJoin(
			currencyTable,
			eq(creditCardTable.currencyId, currencyTable.id),
		)
		.where(eq(accountTable.ownerId, user.id))
		.orderBy(desc(creditCardTable.createdAt))

	return { creditCards }
}

export default function CreditCards({
	loaderData: { creditCards },
}: Route.ComponentProps) {
	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='credit-cards-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='credit-cards-section' level='h3'>
					Credit Cards
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Credit Card</span>
					</Link>
				</Button>
			</div>

			{creditCards.length === 0 ? (
				<div className='my-2'>
					<Text size='md' weight='medium' alignment='center'>
						You have not created any credit cards yet. Start
						creating them{' '}
						<Link to='create' className='text-primary'>
							here
						</Link>
					</Text>
				</div>
			) : (
				<ul className='flex flex-col gap-2'>
					{creditCards.map(
						({
							id,
							last4,
							brand,
							expiryMonth,
							expiryYear,
							currencyCode,
							accountName,
						}) => {
							const { label } = CURRENCY_DISPLAY[currencyCode]
							return (
								<li
									key={id}
									className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border rounded-xl'
								>
									<Link
										to={id}
										prefetch='intent'
										className='flex items-center gap-4'
									>
										<CreditCardIcon className='size-5 text-muted-foreground' />
										<div className='flex flex-col gap-1'>
											<Text weight='medium'>
												{brand} •••• {last4}
											</Text>
											<Text size='sm' theme='muted'>
												Expires {expiryMonth}/
												{expiryYear}
											</Text>
										</div>
									</Link>
									<div className='flex items-center gap-4'>
										<Text className='flex items-center gap-2'>
											<CurrencyIcon
												currency={currencyCode}
												size='sm'
											/>
											{label}
										</Text>
										<Text size='sm' theme='muted'>
											{accountName}
										</Text>
									</div>
								</li>
							)
						},
					)}
				</ul>
			)}
		</section>
	)
}
