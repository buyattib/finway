import { useTranslation } from 'react-i18next'
import { redirect, useSearchParams } from 'react-router'

import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'

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
import {
	getTransactionsTabData,
	getTransfersTabData,
	getExchangesTabData,
} from './lib/services'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'movements')

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const tabParam = searchParams.get('tab')
	const tab = MOVEMENT_TABS.find(t => t === tabParam)
	if (!tab) {
		searchParams.set('tab', DEFAULT_MOVEMENT_TAB)
		throw redirect(url.pathname + url.search)
	}

	const meta = {
		title: t('index.meta.title'),
		description: t('index.meta.description'),
	}

	if (tab === MOVEMENT_TAB_TRANSACTIONS) {
		const data = await getTransactionsTabData({
			db,
			ownerId: user.id,
			searchParams,
		})
		return { tab, meta, transactions: data }
	}

	if (tab === MOVEMENT_TAB_TRANSFERS) {
		const data = await getTransfersTabData({
			db,
			ownerId: user.id,
			searchParams,
		})
		return { tab, meta, transfers: data }
	}

	const data = await getExchangesTabData({
		db,
		ownerId: user.id,
		searchParams,
	})
	return { tab, meta, exchanges: data }
}

export default function Movements({ loaderData }: Route.ComponentProps) {
	const { tab } = loaderData
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

					{loaderData.tab === MOVEMENT_TAB_TRANSACTIONS && (
						<TabsContent value={MOVEMENT_TAB_TRANSACTIONS}>
							<TransactionsTab {...loaderData.transactions} />
						</TabsContent>
					)}
					{loaderData.tab === MOVEMENT_TAB_TRANSFERS && (
						<TabsContent value={MOVEMENT_TAB_TRANSFERS}>
							<TransfersTab {...loaderData.transfers} />
						</TabsContent>
					)}
					{loaderData.tab === MOVEMENT_TAB_EXCHANGES && (
						<TabsContent value={MOVEMENT_TAB_EXCHANGES}>
							<ExchangesTab {...loaderData.exchanges} />
						</TabsContent>
					)}
				</Tabs>
			</PageContent>
		</PageSection>
	)
}
