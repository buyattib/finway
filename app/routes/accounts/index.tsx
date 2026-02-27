import { useEffect } from 'react'
import {
	createSearchParams,
	Form,
	Link,
	useNavigation,
	useSubmit,
} from 'react-router'
import {
	BanknoteArrowDownIcon,
	EllipsisIcon,
	PlusIcon,
	SquarePenIcon,
} from 'lucide-react'
import { desc, eq, and, like, sql } from 'drizzle-orm'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'
import { getServerT } from '~/utils-server/i18n.server'
import { account as accountTable } from '~/database/schema'
import { formatNumber, getCurrencySymbol } from '~/lib/utils'
import { getBalances } from '~/lib/queries'
import type { TAccountBalance } from '~/lib/types'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { Input } from '~/components/ui/input'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Spinner } from '~/components/ui/spinner'

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
	const t = getServerT(context, 'accounts')

	const url = new URL(request.url)
	const search = url.searchParams.get('search')

	const balances = await getBalances({ db, ownerId: user.id })
	const balancesByAccount = balances.reduce(
		(acc, { accountId, currencyId, currency, balance }) => {
			acc[accountId] = acc[accountId] || []
			acc[accountId].push({
				id: `${accountId}-${currencyId}`,
				currency,
				balance,
			})
			return acc
		},
		{} as Record<string, TAccountBalance[]>,
	)

	const filters = [eq(accountTable.ownerId, user.id)]
	if (search) {
		filters.push(
			like(sql`lower(${accountTable.name})`, `%${search.toLowerCase()}%`),
		)
	}

	const accountsQuery = await db
		.select({
			id: accountTable.id,
			name: accountTable.name,
			description: accountTable.description,
			accountType: accountTable.accountType,
		})
		.from(accountTable)
		.where(and(...filters))
		.orderBy(desc(accountTable.createdAt))

	const accounts = accountsQuery.map(acc => ({
		...acc,
		balances: balancesByAccount[acc.id]
			.filter(({ balance }) => Number(balance) > 0)
			.slice(0, 3),
	}))

	return {
		accounts,
		search,
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export default function Accounts({
	loaderData: { accounts, search },
}: Route.ComponentProps) {
	const navigation = useNavigation()
	const submit = useSubmit()
	const { t } = useTranslation(['accounts', 'components'])

	useEffect(() => {
		const searchField = document.getElementById('search')
		if (searchField instanceof HTMLInputElement) {
			searchField.value = search ?? ''
		}
	}, [search])

	const isSearching =
		navigation.location &&
		navigation.location.search &&
		navigation.location.search.includes('search')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='accounts-section'
		>
			<header className='flex items-center justify-between'>
				<Title id='accounts-section' level='h3'>
					{t('index.title')}
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>
							{t('index.addAccountLabel')}
						</span>
					</Link>
				</Button>
			</header>

			<Form
				id='search-accounts'
				role='search'
				onChange={event => {
					const isFirstSearch = search === null
					submit(event.currentTarget, { replace: !isFirstSearch })
				}}
			>
				<Input
					className='px-6'
					id='search'
					name='search'
					type='search'
					aria-label={t('index.searchPlaceholder')}
					placeholder={t('index.searchPlaceholder')}
					defaultValue={search ?? ''}
				/>
			</Form>

			<div className='h-4'>
				{isSearching && <Spinner size='sm' className='mx-auto' />}
			</div>

			{accounts.length === 0 && (
				<div className='my-2'>
					{!search ? (
						<Text size='md' weight='medium' alignment='center'>
							<Trans ns='accounts' i18nKey='index.emptyMessage'>
								You have not created any accounts yet. Start
								creating them{' '}
								<Link to='create' className='text-primary'>
									here
								</Link>
							</Trans>
						</Text>
					) : (
						<Text size='md' weight='medium' alignment='center'>
							{t('index.emptySearchMessage', { search })}
						</Text>
					)}
				</div>
			)}

			<ul className='flex flex-col gap-2'>
				{accounts.map(
					({ id, name, description, accountType, balances }) => (
						<li
							key={id}
							className='flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center border rounded-xl p-4 sm:px-6 min-h-32'
						>
							<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
								<Link
									to={id}
									prefetch='intent'
									className='flex items-center gap-4 w-3xs'
								>
									<AccountTypeIcon
										accountType={accountType}
									/>
									<div className='flex flex-col sm:gap-2 gap-4'>
										<div className='flex flex-col gap-1'>
											<Title id={id} level='h5'>
												{name}
											</Title>
											<Text size='sm' theme='primary'>
												{t(
													`components:accountType.${accountType}`,
												)}
											</Text>
										</div>
										{description && (
											<Text size='sm' theme='muted'>
												{description}
											</Text>
										)}
									</div>
								</Link>
								<div className='sm:h-32 sm:border-l border-b' />
								{balances.length !== 0 && (
									<ul
										className='flex flex-col justify-center gap-2'
										aria-labelledby={id}
									>
										{balances.map(
											({
												id: bId,
												balance,
												currency,
											}) => {
												const symbol =
													getCurrencySymbol(currency)
												const [, currencyId] =
													bId.split('-')
												return (
													<li
														key={bId}
														className='flex items-center gap-4'
													>
														<Link
															to={{
																pathname:
																	'../transactions/create',
																search: createSearchParams(
																	{
																		accountId:
																			id,
																		currencyId,
																	},
																).toString(),
															}}
														>
															<Text className='flex items-center gap-2'>
																<CurrencyIcon
																	currency={
																		currency
																	}
																	size='sm'
																/>
																{currency}
															</Text>
														</Link>
														<Text>
															{`${symbol} ${formatNumber(balance)}`}
														</Text>
													</li>
												)
											},
										)}
									</ul>
								)}
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size='icon' variant='ghost'>
										<EllipsisIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem>
										<SquarePenIcon />
										<Link to={`${id}/edit`}>
											{t('index.editAction')}
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<BanknoteArrowDownIcon />
										<Link
											to={{
												pathname:
													'../transactions/create',
												search: createSearchParams({
													accountId: id,
												}).toString(),
											}}
										>
											{t('index.transactionAction')}
										</Link>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</li>
					),
				)}
			</ul>
		</section>
	)
}
