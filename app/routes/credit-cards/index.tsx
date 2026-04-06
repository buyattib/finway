import { Link } from 'react-router'
import { CreditCardIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { EmptyState } from '~/components/empty-state'
import { CreditCard } from '~/components/credit-card'

import { getCreditCards } from './lib/queries'

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

	const creditCards = await getCreditCards({ db, ownerId: user.id })

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
	const { t } = useTranslation('credit-cards')

	return (
		<PageSection id='credit-cards-section'>
			<PageHeader>
				<Title id='credit-cards-section' level='h3'>
					{t('index.title')}
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create'>
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
						title={t('index.emptyTitle')}
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
					<ul className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
						{creditCards.map(
							({
								id,
								last4,
								brand,
								expiryMonth,
								expiryYear,
								accountName,
							}) => (
								<li key={id}>
									<Link
										to={id}
										className='block transition-transform hover:scale-[1.02]'
									>
										<CreditCard
											brand={brand}
											last4={last4}
											expiryMonth={expiryMonth}
											expiryYear={expiryYear}
											accountName={accountName}
										/>
									</Link>
								</li>
							),
						)}
					</ul>
				)}
			</PageContent>
		</PageSection>
	)
}
