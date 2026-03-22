import { Link } from 'react-router'
import { CreditCardIcon, PlusIcon } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types'

import {
	creditCard as creditCardTable,
	account as accountTable,
} from '~/database/schema'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, getNextDateForDay } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { EmptyState } from '~/components/empty-state'

import { CC_BRAND_GRADIENTS, CC_BRAND_DEFAULT_GRADIENT } from './lib/constants'

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
		})
		.from(creditCardTable)
		.innerJoin(accountTable, eq(creditCardTable.accountId, accountTable.id))
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
					<EmptyState
						icon={CreditCardIcon}
						title={t('index.emptyMessage')}
						action={
							<Button asChild>
								<Link to='create'>
									<PlusIcon />
									{t('index.addCreditCardLabel')}
								</Link>
							</Button>
						}
					/>
				) : (
					<ul className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{creditCards.map(
							({
								id,
								last4,
								brand,
								expiryMonth,
								expiryYear,
								closingDay,
								dueDay,
								accountName,
							}) => {
								const gradient =
									CC_BRAND_GRADIENTS[brand] ??
									CC_BRAND_DEFAULT_GRADIENT
								return (
									<li
										key={id}
										className='flex flex-col gap-3'
									>
										<Link
											to={id}
											prefetch='intent'
											className={`bg-linear-to-br ${gradient} rounded-xl p-6 shadow-lg aspect-[1.586/1] max-w-sm flex flex-col justify-between text-white transition-transform hover:scale-[1.02]`}
										>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													<CreditCardIcon className='size-6 text-white/70' />
													<span className='text-lg font-bold tracking-wide'>
														{brand}
													</span>
												</div>
												<p className='text-xs text-white/70'>
													{accountName}
												</p>
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
														{String(
															expiryMonth,
														).padStart(2, '0')}
														/{expiryYear}
													</p>
												</div>
												<div className='flex flex-col items-end gap-1'>
													<p className='text-xs text-white/70'>
														{t('index.closingDay', {
															date: formatDate(
																getNextDateForDay(
																	closingDay,
																),
															),
														})}
													</p>
													<p className='text-xs text-white/70'>
														{t('index.dueDay', {
															date: formatDate(
																getNextDateForDay(
																	dueDay,
																),
															),
														})}
													</p>
												</div>
											</div>
										</Link>
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
