import { useTranslation } from 'react-i18next'
import { Link, Outlet, redirect, useSearchParams } from 'react-router'
import { PlusIcon } from 'lucide-react'

import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'

import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { Title } from '~/components/ui/title'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'

import { TransactionsTab } from './components/transactions/tab'
import { TransfersTab } from './components/transfers/tab'
import { ExchangesTab } from './components/exchanges/tab'

import {
	MOVEMENT_TABS,
	MOVEMENT_TAB_EXCHANGES,
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
} from './lib/constants'
import {
	getTransactionsTabData,
	getTransfersTabData,
	getExchangesTabData,
	getMovementFormData,
} from './lib/queries'
import { assertNever } from './lib/utils'

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
		searchParams.set('tab', MOVEMENT_TAB_TRANSACTIONS)
		throw redirect(url.pathname + url.search)
	}

	const meta = {
		title: t('index.meta.title'),
		description: t('index.meta.description'),
	}

	const formData = await getMovementFormData({ db, ownerId: user.id })

	if (tab === MOVEMENT_TAB_TRANSACTIONS) {
		const data = await getTransactionsTabData({
			db,
			ownerId: user.id,
			searchParams,
		})
		return { tab, meta, formData, transactions: data }
	}

	if (tab === MOVEMENT_TAB_TRANSFERS) {
		const data = await getTransfersTabData({
			db,
			ownerId: user.id,
			searchParams,
		})
		return { tab, meta, formData, transfers: data }
	}

	if (tab === MOVEMENT_TAB_EXCHANGES) {
		const data = await getExchangesTabData({
			db,
			ownerId: user.id,
			searchParams,
		})
		return { tab, meta, formData, exchanges: data }
	}

	assertNever(tab)
}

export default function Movements({
	loaderData: { formData, ...data },
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
				<Button variant='default' asChild>
					<Link
						to={{
							pathname: `${data.tab}/create`,
							search: searchParams.toString(),
						}}
					>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>
							{t('index.createLabel')}
						</span>
					</Link>
				</Button>
			</PageHeader>

			<PageContent>
				<Tabs value={data.tab} onValueChange={onTabChange}>
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

					{data.tab === MOVEMENT_TAB_TRANSACTIONS && (
						<TabsContent value={MOVEMENT_TAB_TRANSACTIONS}>
							<TransactionsTab
								{...data.transactions}
								formData={formData}
							/>
						</TabsContent>
					)}
					{data.tab === MOVEMENT_TAB_TRANSFERS && (
						<TabsContent value={MOVEMENT_TAB_TRANSFERS}>
							<TransfersTab
								{...data.transfers}
								formData={formData}
							/>
						</TabsContent>
					)}
					{data.tab === MOVEMENT_TAB_EXCHANGES && (
						<TabsContent value={MOVEMENT_TAB_EXCHANGES}>
							<ExchangesTab
								{...data.exchanges}
								formData={formData}
							/>
						</TabsContent>
					)}
				</Tabs>
			</PageContent>

			<Outlet />
		</PageSection>
	)
}
