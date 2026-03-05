import { Link } from 'react-router'
import { CreditCardIcon, PlusIcon } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from './+types'

import {
	creditCard as creditCardTable,
	account as accountTable,
	currency as currencyTable,
} from '~/database/schema'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, getNextDateForDay } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { CurrencyIcon } from '~/components/currency-icon'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'credit-cards')

	const creditCards = await db
		.select({
			id: creditCardTable.id,
			last4: creditCardTable.last4,
			brand: creditCardTable.brand,
			expiryMonth: creditCardTable.expiryMonth,
			expiryYear: creditCardTable.expiryYear,
			closingDay: creditCardTable.closingDay,
			dueDay: creditCardTable.dueDay,
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

	return {
		creditCards,
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export default function CreditCards({
	loaderData: { creditCards },
}: Route.ComponentProps) {
	const { t } = useTranslation(['credit-cards', 'constants'])

	return (
		<PageSection id='credit-cards-section'>
			<PageHeader>
				<Title id='credit-cards-section' level='h3'>
					{t('index.title')}
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>
							{t('index.addCreditCardLabel')}
						</span>
					</Link>
				</Button>
			</PageHeader>

			<PageContent>
				{creditCards.length === 0 ? (
					<div className='my-2'>
						<Text size='md' weight='medium' alignment='center'>
							<Trans
								i18nKey='index.emptyMessage'
								ns='credit-cards'
								components={[
									<Link
										key='0'
										to='create'
										className='text-primary'
									/>,
								]}
							/>
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
								closingDay,
								dueDay,
								currencyCode,
								accountName,
							}) => {
								const label = t(
									`constants:currency.${currencyCode}`,
								)
								return (
									<li
										key={id}
										className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border rounded-xl'
									>
										<Link
											to={id}
											prefetch='intent'
											className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6'
										>
											<div className='flex items-center gap-4'>
												<CreditCardIcon className='size-5 text-muted-foreground' />
												<div className='flex flex-col gap-1'>
													<Text weight='medium'>
														{brand} •••• {last4}
													</Text>
													<Text
														size='sm'
														theme='muted'
													>
														{t('index.expires', {
															month: expiryMonth,
															year: expiryYear,
														})}
													</Text>
												</div>
											</div>
											<div className='flex flex-col gap-0.5'>
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
										</Link>
										<div className='flex flex-col gap-0.5'>
											<Text size='sm' theme='muted'>
												{t('index.closingDay', {
													date: formatDate(
														getNextDateForDay(
															closingDay,
														),
													),
												})}
											</Text>
											<Text size='sm' theme='muted'>
												{t('index.dueDay', {
													date: formatDate(
														getNextDateForDay(
															dueDay,
														),
													),
												})}
											</Text>
										</div>
									</li>
								)
							},
						)}
					</ul>
				)}
			</PageContent>
		</PageSection>
	)
}
