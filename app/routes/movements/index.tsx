import { useTranslation } from 'react-i18next'
import { redirect, useSearchParams } from 'react-router'

import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'

import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { Title } from '~/components/ui/title'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'

import { TransactionsTab } from './components/transactions-tab'
import { TransfersTab } from './components/transfers-tab'
import { ExchangesTab } from './components/exchanges-tab'
import {
	DEFAULT_MOVEMENT_TAB,
	MOVEMENT_TABS,
	MOVEMENT_TAB_EXCHANGES,
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
} from './lib/constants'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const t = getServerT(context, 'movements')

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const tabParam = searchParams.get('tab')
	const tab = MOVEMENT_TABS.find(t => t === tabParam)
	if (!tab) {
		searchParams.set('tab', DEFAULT_MOVEMENT_TAB)
		throw redirect(url.pathname + url.search)
	}

	return {
		tab,
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export default function Movements({
	loaderData: { tab },
}: Route.ComponentProps) {
	const { t } = useTranslation('movements')
	const [searchParams, setSearchParams] = useSearchParams()

	const onTabChange = (value: string) => {
		const next = new URLSearchParams(searchParams)
		next.set('tab', value)
		setSearchParams(next, { replace: true })
	}

	return (
		<PageSection id='movements-section'>
			<PageHeader>
				<Title id='movements-section' level='h3'>
					{t('index.title')}
				</Title>
			</PageHeader>

			<PageContent>
				<Tabs value={tab} onValueChange={onTabChange}>
					<TabsList className='w-full'>
						<TabsTrigger value={MOVEMENT_TAB_TRANSACTIONS}>
							{t('index.tabs.transactions')}
						</TabsTrigger>
						<TabsTrigger value={MOVEMENT_TAB_TRANSFERS}>
							{t('index.tabs.transfers')}
						</TabsTrigger>
						<TabsTrigger value={MOVEMENT_TAB_EXCHANGES}>
							{t('index.tabs.exchanges')}
						</TabsTrigger>
					</TabsList>
					<TabsContent value={MOVEMENT_TAB_TRANSACTIONS}>
						<TransactionsTab />
					</TabsContent>
					<TabsContent value={MOVEMENT_TAB_TRANSFERS}>
						<TransfersTab />
					</TabsContent>
					<TabsContent value={MOVEMENT_TAB_EXCHANGES}>
						<ExchangesTab />
					</TabsContent>
				</Tabs>
			</PageContent>
		</PageSection>
	)
}
